const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = 'super_secret_profit_key';

// Diagnóstico de boot
console.log('🚀 Iniciando ProfitCalc ERP...');
console.log('🔌 DATABASE_URL configurada:', !!process.env.DATABASE_URL);
console.log('🌐 PORT:', PORT);

// PostgreSQL connection pool
const dbUrl = process.env.DATABASE_URL || '';
const pool = new Pool(
  dbUrl ? {
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10
  } : {}
);

// CRÍTICO: sem este handler, erros de conexão pool matam o processo no Node 18+
pool.on('error', (err) => {
  console.error('⚠️ Pool error (não fatal):', err.message);
});

// Handlers globais para manter o servidor vivo
process.on('uncaughtException', (err) => {
  console.error('⚠️ uncaughtException:', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ unhandledRejection:', reason?.message || reason);
});

// BUILD: 2026-03-31-v6
// =====================
// EXPRESS MIDDLEWARE
// =====================
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

// Ping imediato (sem banco) - confirma que servidor está vivo
app.get('/ping', (req, res) => {
  res.json({ alive: true, port: PORT, db_url_set: !!process.env.DATABASE_URL, ts: Date.now() });
});

// Health check com banco
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', port: PORT, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected', port: PORT, error: err.message });
  }
});


// =====================
// EAN-8 HELPER
// =====================
// Generates a valid EAN-8 barcode string (8 digits) from a numeric ID.
// Uses the variation's database ID zero-padded to 7 digits, then appends the check digit.
function computeEan8(id) {
  const digits = String(id).padStart(7, '0').slice(-7); // ensure exactly 7 digits
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    sum += parseInt(digits[i]) * (i % 2 === 0 ? 3 : 1);
  }
  const check = (10 - (sum % 10)) % 10;
  return digits + check;
}

// =====================
// INIT DATABASE
// =====================
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS companies (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'user',
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      company_id INTEGER,
      name TEXT,
      product_cost REAL,
      sale_price REAL,
      tax_percent REAL,
      tax_fixed_percent REAL,
      tax_fixed REAL,
      additional_costs REAL,
      cost REAL,
      profit REAL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS catalog_products (
      id SERIAL PRIMARY KEY,
      company_id INTEGER,
      name TEXT,
      description TEXT,
      image_data TEXT,
      base_cost REAL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS product_prices (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES catalog_products(id) ON DELETE CASCADE,
      type TEXT,
      label TEXT,
      value REAL,
      cost REAL,
      profit REAL
    );

    CREATE TABLE IF NOT EXISTS variations (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES catalog_products(id) ON DELETE CASCADE,
      color TEXT,
      size TEXT,
      sku TEXT,
      ean8 TEXT,
      stock INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id SERIAL PRIMARY KEY,
      company_id INTEGER,
      name TEXT,
      start_date TEXT,
      end_date TEXT,
      discount_percent REAL,
      discount_fixed REAL,
      marketplace_id INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS campaign_products (
      campaign_id INTEGER,
      product_id INTEGER,
      PRIMARY KEY(campaign_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS sales (
      id SERIAL PRIMARY KEY,
      company_id INTEGER,
      sale_date TEXT,
      variation_id INTEGER REFERENCES variations(id) ON DELETE CASCADE,
      quantity INTEGER,
      marketplace_id INTEGER,
      unit_price REAL,
      unit_cost REAL,
      unit_profit REAL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS production_entries (
      id SERIAL PRIMARY KEY,
      company_id INTEGER,
      entry_date TEXT,
      variation_id INTEGER REFERENCES variations(id) ON DELETE CASCADE,
      quantity INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS marketplaces (
      id SERIAL PRIMARY KEY,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      name TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      name TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS wholesale_orders (
      id SERIAL PRIMARY KEY,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      total_amount REAL,
      status TEXT DEFAULT 'Pendente',
      whatsapp_sent INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS wholesale_order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES wholesale_orders(id) ON DELETE CASCADE,
      variation_id INTEGER REFERENCES variations(id) ON DELETE SET NULL,
      quantity INTEGER,
      unit_price REAL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      company_id INTEGER,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      notify_hours REAL DEFAULT 24,
      status TEXT DEFAULT 'a_fazer',
      last_notified_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  console.log('✅ Tabelas criadas/verificadas com sucesso.');

  // Migration: add ean8 column if it doesn't exist yet
  try {
    await pool.query(`ALTER TABLE variations ADD COLUMN IF NOT EXISTS ean8 TEXT`);
    // Populate ean8 for existing variations that don't have one
    const missing = await pool.query(`SELECT id FROM variations WHERE ean8 IS NULL OR ean8 = ''`);
    for (const row of missing.rows) {
      const code = computeEan8(row.id);
      await pool.query(`UPDATE variations SET ean8 = $1 WHERE id = $2`, [code, row.id]);
    }
    if (missing.rows.length > 0) console.log(`✅ EAN-8 gerado para ${missing.rows.length} variação(ões) existente(s).`);
  } catch (e) {
    console.warn('Aviso na migração EAN-8:', e.message);
  }

  await seed();
}

// =====================
// SEED
// =====================
async function seed() {
  try {
    // Create companies
    await pool.query(`INSERT INTO companies (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, ['Ame Modas']);
    await pool.query(`INSERT INTO companies (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, ['Shine Modas']);

    const companiesRes = await pool.query('SELECT * FROM companies');
    const companies = companiesRes.rows;
    const ameId = companies.find(c => c.name === 'Ame Modas')?.id;
    const shineId = companies.find(c => c.name === 'Shine Modas')?.id;

    if (ameId) {
      const hashAme = bcrypt.hashSync('Ame@Modas', 10);
      await pool.query(
        `INSERT INTO users (username, password, role, company_id) VALUES ($1, $2, $3, $4)
         ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role, company_id = EXCLUDED.company_id`,
        ['Ame Modas', hashAme, 'user', ameId]
      );
    }

    if (shineId) {
      const hashShine = bcrypt.hashSync('Shine_2026', 10);
      await pool.query(
        `INSERT INTO users (username, password, role, company_id) VALUES ($1, $2, $3, $4)
         ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role, company_id = EXCLUDED.company_id`,
        ['Shine Modas', hashShine, 'user', shineId]
      );
    }

    console.log("✅ Seed: 'Ame Modas' e 'Shine Modas' configurados.");
  } catch (e) {
    console.warn('Aviso no seed:', e.message);
  }
}


// =====================
// MARKETPLACE PRESETS (mirrors client-side presets for server-side auto-reprice)
// =====================
const MARKETPLACE_PRESETS_SERVER = [
  { match: 'tiktok', taxP: 8,  taxPFixed: 6,  taxF: 4, costs: 0 },
  { match: 'shein',  taxP: 8,  taxPFixed: 20, taxF: 4, costs: 0 },
  { match: 'shopee', taxP: 8,  taxPFixed: 20, taxF: 4, costs: 2 }
];

const AUTO_PRICE_MARGIN_SERVER = 0.325;

function getStorePresetServer(label) {
  const lower = (label || '').toLowerCase();
  const found = MARKETPLACE_PRESETS_SERVER.find(p => lower.includes(p.match));
  if (found) return { taxP: found.taxP, taxPFixed: found.taxPFixed, taxF: found.taxF, costs: found.costs };
  return { taxP: 0, taxPFixed: 0, taxF: 0, costs: 0 };
}

function calcIdealPriceServer(baseCost, preset, margin = AUTO_PRICE_MARGIN_SERVER) {
  const taxPercent = (preset.taxP + preset.taxPFixed) / 100;
  const divisor = 1 - taxPercent - margin;
  if (divisor <= 0) return null;
  const sPrice = (baseCost + preset.taxF + preset.costs) / divisor;
  return Math.ceil(sPrice * 100) / 100; // round up to cent
}

// =====================
// AUTH MIDDLEWARE
// =====================
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token || req.headers['authorization'];
  if (!token) return res.status(401).json({ message: 'Não autorizado' });
  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Sessão expirada' });
    req.user = user;
    next();
  });
};

// =====================
// AUTH ROUTES
// =====================
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(
      `SELECT u.*, c.name as company_name
       FROM users u JOIN companies c ON u.company_id = c.id
       WHERE u.username = $1`,
      [username]
    );
    const user = result.rows[0];
    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role, company_id: user.company_id },
        SECRET, { expiresIn: '8h' }
      );
      res.cookie('token', token, { httpOnly: true });
      return res.json({ token, role: user.role, username: user.username, company_name: user.company_name });
    }
    res.status(401).json({ message: 'Credenciais inválidas' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro interno no login' });
  }
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Deslogado com sucesso' });
});

// =====================
// CATALOG ROUTES
// =====================
app.get('/api/catalog', authenticateToken, async (req, res) => {
  const { company_id } = req.user;
  try {
    const productsRes = await pool.query(
      'SELECT * FROM catalog_products WHERE company_id = $1 ORDER BY created_at DESC',
      [company_id]
    );
    const products = productsRes.rows;

    const enhanced = await Promise.all(products.map(async p => {
      const variationsRes = await pool.query('SELECT * FROM variations WHERE product_id = $1', [p.id]);
      const pricesRes = await pool.query('SELECT * FROM product_prices WHERE product_id = $1', [p.id]);
      return { ...p, variations: variationsRes.rows, prices: pricesRes.rows };
    }));

    res.json(enhanced);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao carregar catálogo' });
  }
});

app.post('/api/catalog', authenticateToken, async (req, res) => {
  const { company_id } = req.user;
  const { name, description, image_data, base_cost, variations, prices } = req.body;
  if (!name) return res.status(400).json({ message: 'Nome do produto é obrigatório.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      'INSERT INTO catalog_products (company_id, name, description, image_data, base_cost) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [company_id, name, description || '', image_data || null, Number(base_cost) || 0]
    );
    const productId = result.rows[0].id;

    if (Array.isArray(variations)) {
      for (const v of variations) {
        const result = await client.query(
          'INSERT INTO variations (product_id, color, size, sku) VALUES ($1,$2,$3,$4) RETURNING id',
          [productId, v.color || '', v.size || '', v.sku || '']
        );
        const newId = result.rows[0].id;
        const ean8 = computeEan8(newId);
        await client.query('UPDATE variations SET ean8 = $1 WHERE id = $2', [ean8, newId]);
      }
    }

    if (Array.isArray(prices)) {
      for (const pr of prices) {
        await client.query(
          'INSERT INTO product_prices (product_id, type, label, value) VALUES ($1,$2,$3,$4)',
          [productId, pr.type, pr.label, pr.value]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ id: productId, message: 'Produto cadastrado com sucesso' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Erro ao cadastrar produto.', error: err.message });
  } finally {
    client.release();
  }
});

app.put('/api/catalog/:id', authenticateToken, async (req, res) => {
  const { name, description, image_data, base_cost, variations, prices } = req.body;
  const productId = req.params.id;
  if (!name) return res.status(400).json({ message: 'Nome do produto obrigatório.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      'UPDATE catalog_products SET name=$1, description=$2, image_data=$3, base_cost=$4 WHERE id=$5',
      [name, description || '', image_data || null, Number(base_cost) || 0, productId]
    );

    if (Array.isArray(variations)) {
      const existingRes = await client.query('SELECT * FROM variations WHERE product_id = $1', [productId]);
      const existingVars = existingRes.rows;
      const newVarKeys = variations.map(v => `${v.color}|${v.size}`);

      for (const ev of existingVars) {
        if (!newVarKeys.includes(`${ev.color}|${ev.size}`)) {
          await client.query('DELETE FROM variations WHERE id = $1', [ev.id]);
        }
      }

      for (const nv of variations) {
        const existing = existingVars.find(ev => ev.color === nv.color && ev.size === nv.size);
        if (existing) {
          if (existing.sku !== nv.sku) await client.query('UPDATE variations SET sku=$1 WHERE id=$2', [nv.sku, existing.id]);
        } else {
          const result = await client.query(
            'INSERT INTO variations (product_id, color, size, sku) VALUES ($1,$2,$3,$4) RETURNING id',
            [productId, nv.color || '', nv.size || '', nv.sku || '']
          );
          const newId = result.rows[0].id;
          const ean8 = computeEan8(newId);
          await client.query('UPDATE variations SET ean8 = $1 WHERE id = $2', [ean8, newId]);
        }
      }
    }

    if (Array.isArray(prices)) {
      await client.query('DELETE FROM product_prices WHERE product_id = $1', [productId]);
      for (const pr of prices) {
        await client.query(
          'INSERT INTO product_prices (product_id, type, label, value) VALUES ($1,$2,$3,$4)',
          [productId, pr.type, pr.label, pr.value]
        );
      }
    }

    // Auto-reprice: if base_cost changed, recalculate all existing prices to maintain ~32.5% margin
    const newCost = Number(base_cost) || 0;
    if (newCost > 0) {
      const existingPricesRes = await client.query(
        'SELECT * FROM product_prices WHERE product_id = $1',
        [productId]
      );
      const existingPrices = existingPricesRes.rows;

      for (const ep of existingPrices) {
        // Atacado is always manual — never auto-reprice it
        if (ep.label === 'Atacado' || ep.type === 'wholesale') continue;

        const preset = getStorePresetServer(ep.label);
        const newSalePrice = calcIdealPriceServer(newCost, preset);
        if (!newSalePrice) continue;

        const taxAmount = (newSalePrice * (preset.taxP + preset.taxPFixed)) / 100;
        const newTotalCost = newCost + taxAmount + preset.taxF + preset.costs;
        const newProfit = newSalePrice - newTotalCost;

        await client.query(
          'UPDATE product_prices SET value=$1, cost=$2, profit=$3 WHERE id=$4',
          [newSalePrice, newTotalCost, newProfit, ep.id]
        );
      }
    }

    await client.query('COMMIT');
    const repriced = (Number(base_cost) > 0) ? ' Preços recalculados automaticamente.' : '';
    res.json({ message: 'Produto atualizado com sucesso.' + repriced });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Erro ao atualizar produto.', error: err.message });
  } finally {
    client.release();
  }
});

app.delete('/api/catalog/:id', authenticateToken, async (req, res) => {
  await pool.query('DELETE FROM catalog_products WHERE id = $1', [req.params.id]);
  res.json({ message: 'Produto removido do catálogo' });
});

app.post('/api/catalog/:id/prices', authenticateToken, async (req, res) => {
  const { type, label, value, cost, profit } = req.body;
  const productId = req.params.id;
  const { company_id } = req.user;

  if (!type || value === undefined) return res.status(400).json({ message: 'Tipo e Valor são obrigatórios.' });

  try {
    const productRes = await pool.query(
      'SELECT id FROM catalog_products WHERE id = $1 AND company_id = $2',
      [productId, company_id]
    );
    if (!productRes.rows[0]) return res.status(403).json({ message: 'Acesso negado.' });

    const finalLabel = label || 'Geral';
    const existingRes = await pool.query(
      'SELECT id FROM product_prices WHERE product_id = $1 AND label = $2',
      [productId, finalLabel]
    );

    if (existingRes.rows[0]) {
      await pool.query(
        'UPDATE product_prices SET type=$1, value=$2, cost=$3, profit=$4 WHERE id=$5',
        [type, Number(value), Number(cost || 0), Number(profit || 0), existingRes.rows[0].id]
      );
    } else {
      await pool.query(
        'INSERT INTO product_prices (product_id, type, label, value, cost, profit) VALUES ($1,$2,$3,$4,$5,$6)',
        [productId, type, finalLabel, Number(value), Number(cost || 0), Number(profit || 0)]
      );
    }

    if (cost > 0) {
      await pool.query(
        'UPDATE catalog_products SET base_cost=$1 WHERE id=$2 AND (base_cost IS NULL OR base_cost = 0)',
        [Number(cost), productId]
      );
    }

    res.json({ message: 'Preço atualizado com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao salvar preço. ' + err.message });
  }
});

app.delete('/api/prices/:id', authenticateToken, async (req, res) => {
  const { company_id } = req.user;
  try {
    const priceRes = await pool.query(
      `SELECT pp.id FROM product_prices pp
       JOIN catalog_products p ON pp.product_id = p.id
       WHERE pp.id = $1 AND p.company_id = $2`,
      [req.params.id, company_id]
    );
    if (!priceRes.rows[0]) return res.status(403).json({ message: 'Acesso negado ou preço não encontrado.' });

    await pool.query('DELETE FROM product_prices WHERE id = $1', [req.params.id]);
    res.json({ message: 'Preço removido com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao remover preço.' });
  }
});

// =====================
// STOCK ROUTES
// =====================
app.put('/api/stock', authenticateToken, async (req, res) => {
  const stockUpdates = req.body;
  if (!Array.isArray(stockUpdates)) return res.status(400).json({ message: 'Formato inválido.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const update of stockUpdates) {
      if (update.id && typeof update.stock === 'number') {
        await client.query('UPDATE variations SET stock = $1 WHERE id = $2', [update.stock, update.id]);
      }
    }
    await client.query('COMMIT');
    res.json({ message: 'Estoque atualizado com sucesso!' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Erro ao atualizar estoque.', error: err.message });
  } finally {
    client.release();
  }
});

// =====================
// CAMPAIGN ROUTES
// =====================
app.get('/api/campaigns', authenticateToken, async (req, res) => {
  const { company_id } = req.user;
  try {
    const campaignsRes = await pool.query(
      `SELECT c.*, m.name as marketplace_name
       FROM campaigns c LEFT JOIN marketplaces m ON c.marketplace_id = m.id
       WHERE c.company_id = $1 ORDER BY c.created_at DESC`,
      [company_id]
    );

    const enhanced = await Promise.all(campaignsRes.rows.map(async c => {
      const productsRes = await pool.query(
        `SELECT cp.product_id, p.name, p.image_data,
                COALESCE(pp.cost, p.base_cost) as base_cost,
                COALESCE(pp.value, 0) as sale_price
         FROM campaign_products cp
         JOIN catalog_products p ON cp.product_id = p.id
         LEFT JOIN product_prices pp ON pp.product_id = p.id AND pp.label = $1
         WHERE cp.campaign_id = $2`,
        [c.marketplace_name, c.id]
      );
      return { ...c, products: productsRes.rows };
    }));

    res.json(enhanced);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao carregar campanhas' });
  }
});

app.post('/api/campaigns', authenticateToken, async (req, res) => {
  const { company_id } = req.user;
  const { name, marketplace_id, start_date, end_date, discount_percent, discount_fixed, selected_products } = req.body;
  if (!name) return res.status(400).json({ message: 'Nome da campanha obrigatório.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO campaigns (company_id, name, marketplace_id, start_date, end_date, discount_percent, discount_fixed)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [company_id, name, marketplace_id || null, start_date || null, end_date || null,
       Number(discount_percent) || 0, Number(discount_fixed) || 0]
    );
    const campId = result.rows[0].id;

    if (Array.isArray(selected_products)) {
      for (const pid of selected_products) {
        try {
          await client.query('INSERT INTO campaign_products (campaign_id, product_id) VALUES ($1,$2)', [campId, Number(pid)]);
        } catch (e) { /* ignore duplicate */ }
      }
    }

    await client.query('COMMIT');
    res.json({ id: campId, message: 'Campanha salva com sucesso' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Erro ao salvar campanha', error: err.message });
  } finally {
    client.release();
  }
});

app.put('/api/campaigns/:id', authenticateToken, async (req, res) => {
  const { name, marketplace_id, start_date, end_date, discount_percent, discount_fixed, selected_products } = req.body;
  const campId = req.params.id;
  if (!name) return res.status(400).json({ message: 'Nome da campanha obrigatório.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE campaigns SET name=$1, marketplace_id=$2, start_date=$3, end_date=$4,
       discount_percent=$5, discount_fixed=$6 WHERE id=$7`,
      [name, marketplace_id || null, start_date || null, end_date || null,
       Number(discount_percent) || 0, Number(discount_fixed) || 0, campId]
    );
    await client.query('DELETE FROM campaign_products WHERE campaign_id = $1', [campId]);
    if (Array.isArray(selected_products)) {
      for (const pid of selected_products) {
        try {
          await client.query('INSERT INTO campaign_products (campaign_id, product_id) VALUES ($1,$2)', [campId, Number(pid)]);
        } catch (e) { /* ignore */ }
      }
    }
    await client.query('COMMIT');
    res.json({ message: 'Campanha atualizada com sucesso' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Erro ao atualizar campanha', error: err.message });
  } finally {
    client.release();
  }
});

app.delete('/api/campaigns/:id', authenticateToken, async (req, res) => {
  await pool.query('DELETE FROM campaigns WHERE id = $1', [req.params.id]);
  res.json({ message: 'Campanha removida' });
});

// =====================
// SALES ROUTES
// =====================
app.post('/api/sales/import', authenticateToken, async (req, res) => {
  const { company_id } = req.user;
  const { sale_date, items } = req.body;
  if (!sale_date || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Data ou itens inválidos.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let processedCount = 0;
    const notFoundSkus = [];

    for (const item of items) {
      if (!item.sku) continue;
      const varRes = await client.query(
        `SELECT v.id, v.stock FROM variations v
         JOIN catalog_products p ON v.product_id = p.id
         WHERE LOWER(v.sku) = LOWER($1) AND p.company_id = $2`,
        [item.sku, company_id]
      );
      const v = varRes.rows[0];
      if (!v) {
        if (!notFoundSkus.includes(item.sku)) notFoundSkus.push(item.sku);
        continue;
      }

      await client.query('UPDATE variations SET stock = stock - $1 WHERE id = $2', [item.quantity, v.id]);

      const existingSaleRes = await client.query(
        'SELECT id FROM sales WHERE sale_date = $1 AND variation_id = $2 AND company_id = $3',
        [sale_date, v.id, company_id]
      );
      if (existingSaleRes.rows[0]) {
        await client.query('UPDATE sales SET quantity = quantity + $1 WHERE id = $2', [item.quantity, existingSaleRes.rows[0].id]);
      } else {
        await client.query(
          'INSERT INTO sales (company_id, sale_date, variation_id, quantity) VALUES ($1,$2,$3,$4)',
          [company_id, sale_date, v.id, item.quantity]
        );
      }
      processedCount += item.quantity;
    }

    await client.query('COMMIT');
    res.json({ message: 'Importação processada!', processed: processedCount, notFound: notFoundSkus });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Erro na importação.', error: err.message });
  } finally {
    client.release();
  }
});

app.post('/api/sales/scan', authenticateToken, async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const { company_id } = req.user;
  const { sku, marketplace_id } = req.body;

  if (!sku) return res.status(400).json({ message: 'SKU não fornecido.' });
  if (!marketplace_id) return res.status(400).json({ message: 'Selecione uma loja/marketplace primeiro.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const varRes = await client.query(
      `SELECT v.id, v.stock, v.color, v.size, p.id as product_id, p.name, p.base_cost
       FROM variations v JOIN catalog_products p ON v.product_id = p.id
       WHERE (LOWER(v.sku) = LOWER($1) OR v.ean8 = $1) AND p.company_id = $2`,
      [sku, company_id]
    );
    const variation = varRes.rows[0];
    if (!variation) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'SKU não encontrado.' }); }
    if (variation.stock <= 0) { await client.query('ROLLBACK'); return res.status(400).json({ message: `Estoque esgotado para: ${variation.name}` }); }

    const mktRes = await client.query('SELECT name FROM marketplaces WHERE id = $1 AND company_id = $2', [marketplace_id, company_id]);
    const marketplace = mktRes.rows[0];
    if (!marketplace) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Marketplace não encontrado.' }); }

    let priceDataRes = await client.query(
      'SELECT value, cost, profit FROM product_prices WHERE product_id = $1 AND label = $2',
      [variation.product_id, marketplace.name]
    );
    let priceData = priceDataRes.rows[0];
    if (!priceData) {
      const fallbackRes = await client.query('SELECT value, cost, profit FROM product_prices WHERE product_id = $1 LIMIT 1', [variation.product_id]);
      priceData = fallbackRes.rows[0];
    }

    const price  = priceData ? priceData.value  : 0;
    const cost   = priceData ? priceData.cost   : variation.base_cost;
    const profit = priceData ? priceData.profit : (price - cost);

    await client.query('UPDATE variations SET stock = stock - 1 WHERE id = $1', [variation.id]);
    await client.query(
      `INSERT INTO sales (company_id, sale_date, variation_id, quantity, marketplace_id, unit_price, unit_cost, unit_profit)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [company_id, today, variation.id, 1, marketplace_id, price, cost, profit]
    );

    await client.query('COMMIT');
    res.json({
      message: 'Venda registrada!',
      product: {
        name: variation.name, color: variation.color, size: variation.size,
        newStock: variation.stock - 1, price: Number(price).toFixed(2), marketplace: marketplace.name
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Erro ao processar venda.', error: err.message });
  } finally {
    client.release();
  }
});

app.get('/api/sales', authenticateToken, async (req, res) => {
  const { company_id } = req.user;
  try {
    const result = await pool.query(
      `SELECT s.id, s.sale_date, s.quantity, s.marketplace_id,
              s.unit_price, s.unit_cost, s.unit_profit,
              v.color, v.size, v.sku,
              p.name, p.image_data, p.base_cost,
              m.name as marketplace_name
       FROM sales s
       JOIN variations v ON s.variation_id = v.id
       JOIN catalog_products p ON v.product_id = p.id
       LEFT JOIN marketplaces m ON s.marketplace_id = m.id
       WHERE s.company_id = $1
       ORDER BY s.sale_date DESC, s.created_at DESC`,
      [company_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao carregar vendas' });
  }
});

// =====================
// PRODUCTION ROUTES
// =====================
app.post('/api/production/scan', authenticateToken, async (req, res) => {
  const { company_id } = req.user;
  const { sku } = req.body;
  if (!sku) return res.status(400).json({ message: 'SKU não fornecido.' });
  const today = new Date().toISOString().split('T')[0];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const varRes = await client.query(
      `SELECT v.id, v.stock, v.color, v.size, p.name
       FROM variations v JOIN catalog_products p ON v.product_id = p.id
       WHERE (LOWER(v.sku) = LOWER($1) OR v.ean8 = $1) AND p.company_id = $2`,
      [sku, company_id]
    );
    const variation = varRes.rows[0];
    if (!variation) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'SKU não encontrado.' }); }

    await client.query('UPDATE variations SET stock = stock + 1 WHERE id = $1', [variation.id]);

    const existingRes = await client.query(
      'SELECT id FROM production_entries WHERE entry_date = $1 AND variation_id = $2 AND company_id = $3',
      [today, variation.id, company_id]
    );
    if (existingRes.rows[0]) {
      await client.query('UPDATE production_entries SET quantity = quantity + 1 WHERE id = $1', [existingRes.rows[0].id]);
    } else {
      await client.query(
        'INSERT INTO production_entries (company_id, entry_date, variation_id, quantity) VALUES ($1,$2,$3,$4)',
        [company_id, today, variation.id, 1]
      );
    }

    await client.query('COMMIT');
    res.json({
      message: 'Entrada de produção registrada!',
      product: { name: variation.name, color: variation.color, size: variation.size, newStock: variation.stock + 1 }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Erro ao processar entrada.', error: err.message });
  } finally {
    client.release();
  }
});

app.get('/api/production', authenticateToken, async (req, res) => {
  const { company_id } = req.user;
  try {
    const result = await pool.query(
      `SELECT e.id, e.entry_date, e.quantity,
              v.color, v.size, v.sku,
              p.name, p.image_data, p.base_cost
       FROM production_entries e
       JOIN variations v ON e.variation_id = v.id
       JOIN catalog_products p ON v.product_id = p.id
       WHERE e.company_id = $1
       ORDER BY e.entry_date DESC`,
      [company_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao carregar produção' });
  }
});

// =====================
// MARKETPLACE ROUTES
// =====================
app.get('/api/marketplaces', authenticateToken, async (req, res) => {
  const { company_id } = req.user;
  const result = await pool.query('SELECT * FROM marketplaces WHERE company_id = $1 ORDER BY name ASC', [company_id]);
  res.json(result.rows);
});

app.post('/api/marketplaces', authenticateToken, async (req, res) => {
  const { company_id } = req.user;
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Nome é obrigatório.' });
  try {
    await pool.query('INSERT INTO marketplaces (company_id, name) VALUES ($1,$2)', [company_id, name]);
    res.json({ message: 'Canal cadastrado com sucesso.' });
  } catch (e) {
    res.status(500).json({ message: 'Erro ao cadastrar canal.' });
  }
});

app.delete('/api/marketplaces/:id', authenticateToken, async (req, res) => {
  await pool.query('DELETE FROM marketplaces WHERE id = $1 AND company_id = $2', [req.params.id, req.user.company_id]);
  res.json({ message: 'Canal excluído.' });
});

// =====================
// ANALYSIS ROUTE
// =====================
app.get('/api/analysis/profit', authenticateToken, async (req, res) => {
  const { company_id } = req.user;
  const today = new Date().toISOString().split('T')[0];

  try {
    const productsRes = await pool.query(
      'SELECT id, name, base_cost, image_data FROM catalog_products WHERE company_id = $1',
      [company_id]
    );
    const products = productsRes.rows;
    if (!products.length) return res.json({ products: [], summary: {} });

    const salesRes = await pool.query(
      `SELECT s.sale_date, s.quantity, v.product_id
       FROM sales s JOIN variations v ON s.variation_id = v.id
       WHERE s.company_id = $1`,
      [company_id]
    );
    const sales = salesRes.rows;

    const campaignsRes = await pool.query(
      `SELECT c.*, cp.product_id FROM campaigns c
       JOIN campaign_products cp ON c.id = cp.campaign_id
       WHERE c.company_id = $1`,
      [company_id]
    );
    const campaigns = campaignsRes.rows;

    let globalRevenue = 0, globalCost = 0, globalUnits = 0;

    const results = await Promise.all(products.map(async p => {
      const pSales = sales.filter(s => s.product_id === p.id);
      const pCampaigns = campaigns.filter(c => c.product_id === p.id);

      const pricesRes = await pool.query('SELECT * FROM product_prices WHERE product_id = $1', [p.id]);
      const pPrices = pricesRes.rows;

      const bestPriceEntry = pPrices.find(pr => pr.type === 'marketplace') || pPrices[0];
      const basePrice = bestPriceEntry?.value || 0;
      const realCost = (bestPriceEntry && bestPriceEntry.cost > 0) ? bestPriceEntry.cost : p.base_cost;

      let totalRevenue = 0, totalUnits = 0;
      pSales.forEach(s => {
        let effectivePrice = basePrice;
        const activeCampaign = pCampaigns.find(c => s.sale_date >= c.start_date && s.sale_date <= c.end_date);
        if (activeCampaign) {
          if (activeCampaign.discount_percent) effectivePrice *= (1 - activeCampaign.discount_percent / 100);
          else if (activeCampaign.discount_fixed) effectivePrice -= activeCampaign.discount_fixed;
        }
        totalRevenue += effectivePrice * s.quantity;
        totalUnits += s.quantity;
      });

      const totalCost = realCost * totalUnits;
      const netProfit = totalRevenue - totalCost;

      const currentCampaign = pCampaigns.find(c => today >= c.start_date && today <= c.end_date);
      let currentEffectivePrice = basePrice;
      if (currentCampaign) {
        if (currentCampaign.discount_percent) currentEffectivePrice *= (1 - currentCampaign.discount_percent / 100);
        else if (currentCampaign.discount_fixed) currentEffectivePrice -= currentCampaign.discount_fixed;
      }

      globalRevenue += totalRevenue;
      globalCost += totalCost;
      globalUnits += totalUnits;

      const currentProfitReais = currentEffectivePrice - realCost;
      const currentProfitPercent = currentEffectivePrice > 0 ? (currentProfitReais / currentEffectivePrice) * 100 : 0;

      return {
        id: p.id, name: p.name, image_data: p.image_data,
        base_cost: p.base_cost, real_cost: realCost, prices: pPrices,
        current_effective_price: currentEffectivePrice,
        total_sold: totalUnits,
        profitReais: currentProfitReais,
        profitPercent: currentProfitPercent,
        is_campaign: !!currentCampaign
      };
    }));

    const avgSold = globalUnits / products.length;
    const sumMargins = results.reduce((acc, p) => acc + p.profitPercent, 0);
    const portfolioMargin = products.length > 0 ? (sumMargins / products.length) : 0;

    const finalProducts = results.map(p => {
      let suggestion = 'Manter', status = 'Estável', color = 'var(--text-muted)';
      if (p.total_sold > avgSold * 1.5) {
        status = 'Alta Saída 🔥';
        suggestion = p.profitPercent < 25 ? 'Subir Preço (+10%)' : 'Lucro Ótimo';
        color = p.profitPercent < 25 ? 'var(--success)' : 'var(--primary)';
      } else if (p.total_sold < avgSold * 0.5 || p.total_sold === 0) {
        status = 'Baixa Saída 🧊';
        suggestion = p.profitPercent > 15 ? 'Baixar Preço (-10%)' : 'Liquidar / Promoção';
        color = 'var(--danger)';
      }
      if (p.is_campaign) status = 'Em Campanha 📢';
      return { ...p, status, suggestion, suggestionColor: color };
    }).sort((a, b) => b.profitReais - a.profitReais);

    res.json({
      products: finalProducts,
      summary: {
        portfolioMargin: portfolioMargin.toFixed(1),
        totalUnits: globalUnits,
        topPerformer: finalProducts[0]?.name || 'Nenhum',
        avgSold: avgSold.toFixed(1)
      }
    });
  } catch (err) {
    console.error('Erro na análise:', err);
    res.status(500).json({ message: 'Erro ao processar análise.', error: err.message });
  }
});

// =====================
// WHOLESALE & CUSTOMERS
// =====================
app.get('/api/customers', authenticateToken, async (req, res) => {
  const { company_id } = req.user;
  const result = await pool.query('SELECT * FROM customers WHERE company_id = $1 ORDER BY name ASC', [company_id]);
  res.json(result.rows);
});

app.post('/api/customers', authenticateToken, async (req, res) => {
  const { company_id } = req.user;
  const { name, phone, email, address } = req.body;
  if (!name) return res.status(400).json({ message: 'Nome é obrigatório' });
  const result = await pool.query(
    'INSERT INTO customers (company_id, name, phone, email, address) VALUES ($1,$2,$3,$4,$5) RETURNING id',
    [company_id, name, phone || '', email || '', address || '']
  );
  res.json({ id: result.rows[0].id, message: 'Cliente cadastrado' });
});

app.delete('/api/customers/:id', authenticateToken, async (req, res) => {
  await pool.query('DELETE FROM customers WHERE id = $1', [req.params.id]);
  res.json({ message: 'Cliente removido' });
});

app.get('/api/wholesale/orders', authenticateToken, async (req, res) => {
  const { company_id } = req.user;
  try {
    const ordersRes = await pool.query(
      `SELECT o.*, c.name as customer_name, c.phone as customer_phone
       FROM wholesale_orders o LEFT JOIN customers c ON o.customer_id = c.id
       WHERE o.company_id = $1 ORDER BY o.created_at DESC`,
      [company_id]
    );

    const enhanced = await Promise.all(ordersRes.rows.map(async o => {
      const itemsRes = await pool.query(
        `SELECT oi.*, p.name as product_name, v.color, v.size, v.sku
         FROM wholesale_order_items oi
         JOIN variations v ON oi.variation_id = v.id
         JOIN catalog_products p ON v.product_id = p.id
         WHERE oi.order_id = $1`,
        [o.id]
      );
      return { ...o, items: itemsRes.rows };
    }));

    res.json(enhanced);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao carregar pedidos' });
  }
});

app.post('/api/wholesale/orders', authenticateToken, async (req, res) => {
  const { company_id } = req.user;
  const { customer_id, items, total_amount } = req.body;
  if (!items || items.length === 0) return res.status(400).json({ message: 'Pedido vazio' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orderRes = await client.query(
      'INSERT INTO wholesale_orders (company_id, customer_id, total_amount) VALUES ($1,$2,$3) RETURNING *',
      [company_id, customer_id || null, total_amount]
    );
    const order = orderRes.rows[0];

    for (const item of items) {
      await client.query(
        'INSERT INTO wholesale_order_items (order_id, variation_id, quantity, unit_price) VALUES ($1,$2,$3,$4)',
        [order.id, item.variation_id, item.quantity, item.unit_price]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Pedido de Venda por Atacado registrado', order });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Erro ao criar venda atacado', error: err.message });
  } finally {
    client.release();
  }
});

app.delete('/api/wholesale/orders/:id', authenticateToken, async (req, res) => {
  await pool.query('DELETE FROM wholesale_orders WHERE id = $1', [req.params.id]);
  res.json({ message: 'Pedido removido' });
});

// =====================
// TASKS ROUTES
// =====================
app.get('/api/tasks', authenticateToken, async (req, res) => {
  const { company_id } = req.user;
  try {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE company_id = $1 ORDER BY created_at DESC',
      [company_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
  const { company_id } = req.user;
  const { title, description, notify_hours } = req.body;
  if (!title) return res.status(400).json({ message: 'Título obrigatório.' });
  try {
    const result = await pool.query(
      'INSERT INTO tasks (company_id, title, description, notify_hours) VALUES ($1,$2,$3,$4) RETURNING *',
      [company_id, title, description || '', Number(notify_hours) || 24]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  const { company_id } = req.user;
  const { title, description, notify_hours, status } = req.body;
  try {
    await pool.query(
      'UPDATE tasks SET title=$1, description=$2, notify_hours=$3, status=$4 WHERE id=$5 AND company_id=$6',
      [title, description || '', Number(notify_hours) || 24, status || 'a_fazer', req.params.id, company_id]
    );
    res.json({ message: 'Tarefa atualizada.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/tasks/:id/notify', authenticateToken, async (req, res) => {
  const { company_id } = req.user;
  try {
    await pool.query(
      'UPDATE tasks SET last_notified_at = NOW() WHERE id=$1 AND company_id=$2',
      [req.params.id, company_id]
    );
    res.json({ message: 'Notificação marcada como lida.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  const { company_id } = req.user;
  try {
    await pool.query('DELETE FROM tasks WHERE id=$1 AND company_id=$2', [req.params.id, company_id]);
    res.json({ message: 'Tarefa removida.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =====================
// START SERVER
// =====================
// IMPORTANTE: Servidor sobe PRIMEIRO para Railway detectar a porta
app.listen(PORT, '0.0.0.0', () => {
  console.log('\x1b[32m%s\x1b[0m', '---');
  console.log(`✅ Servidor ouvindo na porta ${PORT}`);

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não definida! Configure no Railway.');
    return;
  }

  // Conecta ao banco depois que o servidor já está de pé
  initDB()
    .then(() => console.log('✅ Banco de dados pronto!'))
    .catch(err => console.error('❌ Erro no banco:', err.message));
});
