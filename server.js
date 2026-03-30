const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const path = require('path');
const os = require('os');

const app = express();
const db = new Database('database.db');
const PORT = 3000;
const SECRET = 'super_secret_profit_key'; // Simple secret as requested (no .env)

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'user',
    company_id INTEGER,
    FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS catalog_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER,
    name TEXT,
    description TEXT,
    image_data TEXT,
    base_cost REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS product_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    type TEXT, -- 'wholesale' or 'marketplace'
    label TEXT, -- e.g. 'Shopee', 'Mercado Livre', 'Showroom'
    value REAL,
    cost REAL, -- Added: Calculated cost
    profit REAL, -- Added: Calculated profit
    FOREIGN KEY(product_id) REFERENCES catalog_products(id) ON DELETE CASCADE
  );



  CREATE TABLE IF NOT EXISTS variations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    color TEXT,
    size TEXT,
    sku TEXT,
    stock INTEGER DEFAULT 0,
    FOREIGN KEY(product_id) REFERENCES catalog_products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER,
    name TEXT,
    start_date TEXT,
    end_date TEXT,
    discount_percent REAL,
    discount_fixed REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS campaign_products (
    campaign_id INTEGER,
    product_id INTEGER,
    PRIMARY KEY(campaign_id, product_id)
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER,
    sale_date TEXT,
    variation_id INTEGER,
    quantity INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(variation_id) REFERENCES variations(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS production_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER,
    entry_date TEXT,
    variation_id INTEGER,
    quantity INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(variation_id) REFERENCES variations(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS marketplaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER,
    name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS wholesale_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER,
    customer_id INTEGER,
    total_amount REAL,
    status TEXT DEFAULT 'Pendente',
    whatsapp_sent INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS wholesale_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    variation_id INTEGER,
    quantity INTEGER,
    unit_price REAL,
    FOREIGN KEY(order_id) REFERENCES wholesale_orders(id) ON DELETE CASCADE,
    FOREIGN KEY(variation_id) REFERENCES variations(id) ON DELETE SET NULL
  );
`);

// Database Migrations (Safe adding of columns)
try { db.exec("ALTER TABLE product_prices ADD COLUMN cost REAL;"); } catch(e) {}
try { db.exec("ALTER TABLE campaigns ADD COLUMN marketplace_id INTEGER;"); } catch(e) {}
try { db.exec("ALTER TABLE product_prices ADD COLUMN profit REAL;"); } catch(e) {}
const tablesToMigrate = ['products', 'catalog_products', 'campaigns', 'sales', 'users'];
tablesToMigrate.forEach(table => {
  try { db.exec(`ALTER TABLE ${table} ADD COLUMN company_id INTEGER`); } catch (e) { }
});
try { db.exec(`ALTER TABLE production_entries ADD COLUMN company_id INTEGER`); } catch (e) { }
try { db.exec(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`); } catch (e) { }
try { db.exec(`ALTER TABLE sales ADD COLUMN marketplace_id INTEGER`); } catch (e) { }
try { db.exec(`ALTER TABLE sales ADD COLUMN unit_price REAL`); } catch (e) { }
try { db.exec(`ALTER TABLE sales ADD COLUMN unit_cost REAL`); } catch (e) { }
try { db.exec(`ALTER TABLE sales ADD COLUMN unit_profit REAL`); } catch (e) { }

// SEED: Clean up old admin and setup requested stores
const seed = () => {
  // 1. Delete Old Admin & Matriz Data (Cleanup)
  try {
    const oldAdminComp = db.prepare('SELECT id FROM companies WHERE name = ?').get('Matriz (Admin)');
    if (oldAdminComp) {
      const cid = oldAdminComp.id;
      db.prepare('DELETE FROM users WHERE company_id = ?').run(cid);
      db.prepare('DELETE FROM products WHERE company_id = ?').run(cid);
      db.prepare('DELETE FROM catalog_products WHERE company_id = ?').run(cid);
      db.prepare('DELETE FROM campaigns WHERE company_id = ?').run(cid);
      db.prepare('DELETE FROM sales WHERE company_id = ?').run(cid);
      db.prepare('DELETE FROM production_entries WHERE company_id = ?').run(cid);
      db.prepare('DELETE FROM companies WHERE id = ?').run(cid);
      console.log("Antigo ADMIN e seus dados foram excluídos com sucesso.");
    }
  } catch (e) { console.warn("Erro ao limpar admin antigo:", e); }

  // Migration: Transfer sale_price from catalog_products to product_prices if it exists
  try {
    const productsWithOldPrice = db.prepare("SELECT id, sale_price FROM catalog_products WHERE sale_price IS NOT NULL AND sale_price > 0").all();
    if (productsWithOldPrice.length > 0) {
      const insertPrice = db.prepare("INSERT INTO product_prices (product_id, type, label, value) VALUES (?, ?, ?, ?)");
      const transaction = db.transaction((prods) => {
        for (const p of prods) {
          insertPrice.run(p.id, 'marketplace', 'Preço Base', p.sale_price);
        }
        // Setting to NULL to avoid re-migration
        try { db.prepare("UPDATE catalog_products SET sale_price = NULL").run(); } catch (e) { }
      });
      transaction(productsWithOldPrice);
      console.log(`Migrated ${productsWithOldPrice.length} prices to new structure.`);
    }
  } catch (err) {
    // Migration already done or column missing
  }

  // 2. Setup New Companies
  const compStmt = db.prepare('INSERT OR IGNORE INTO companies (name) VALUES (?)');
  compStmt.run('Ame Modas');
  compStmt.run('Shine Modas');

  const companies = db.prepare('SELECT * FROM companies').all();
  const ameId = companies.find(c => c.name === 'Ame Modas')?.id;
  const shineId = companies.find(c => c.name === 'Shine Modas')?.id;

  // 3. Setup New Users
  const userStmt = db.prepare('INSERT OR REPLACE INTO users (username, password, role, company_id) VALUES (?, ?, ?, ?)');

  // Ame Modas: Ame@Modas
  const hashAme = bcrypt.hashSync('Ame@Modas', 10);
  userStmt.run('Ame Modas', hashAme, 'user', ameId);

  // Shine Modas: Shine_2026
  const hashShine = bcrypt.hashSync('Shine_2026', 10);
  userStmt.run('Shine Modas', hashShine, 'user', shineId);

  console.log("Logos 'Ame Modas' e 'Shine Modas' configurados.");
};
seed();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

// Middleware for Auth (Enhanced for Multi-tenancy)
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token || req.headers['authorization'];
  if (!token) return res.status(401).json({ message: 'Não autorizado' });

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Sessão expirada' });
    req.user = user;
    next();
  });
};

// Auth Routes
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare(`
    SELECT u.*, c.name as company_name 
    FROM users u 
    JOIN companies c ON u.company_id = c.id 
    WHERE u.username = ?
  `).get(username);

  if (user && bcrypt.compareSync(password, user.password)) {
    // Include company and role in the token
    const token = jwt.sign({
      id: user.id,
      username: user.username,
      role: user.role,
      company_id: user.company_id
    }, SECRET, { expiresIn: '8h' });

    res.cookie('token', token, { httpOnly: true });
    return res.json({ token, role: user.role, username: user.username, company_name: user.company_name });
  }
  res.status(401).json({ message: 'Credenciais inválidas' });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Deslogado com sucesso' });
});

// Catalog Routes
app.get('/api/catalog', authenticateToken, (req, res) => {
  const { company_id, role } = req.user;
  const products = db.prepare('SELECT * FROM catalog_products WHERE company_id = ? ORDER BY created_at DESC').all(company_id);

  const enhanced = products.map(p => {
    const variations = db.prepare('SELECT * FROM variations WHERE product_id = ?').all(p.id);
    const prices = db.prepare('SELECT * FROM product_prices WHERE product_id = ?').all(p.id);
    return { ...p, variations, prices };
  });
  res.json(enhanced);
});

app.post('/api/catalog', authenticateToken, (req, res) => {
  try {
    const { company_id } = req.user;
    const { name, description, image_data, base_cost, variations, prices } = req.body;

    if (!name) return res.status(400).json({ message: 'Nome do produto é obrigatório.' });

    const info = db.prepare(
      'INSERT INTO catalog_products (company_id, name, description, image_data, base_cost) VALUES (?, ?, ?, ?, ?)'
    ).run(company_id, name, description || '', image_data || null, Number(base_cost) || 0);

    const productId = info.lastInsertRowid;

    if (Array.isArray(variations) && variations.length > 0) {
      const insertVar = db.prepare('INSERT INTO variations (product_id, color, size, sku) VALUES (?, ?, ?, ?)');
      for (const v of variations) {
        insertVar.run(productId, v.color || '', v.size || '', v.sku || '');
      }
    }

    if (Array.isArray(prices) && prices.length > 0) {
      const insertPrice = db.prepare('INSERT INTO product_prices (product_id, type, label, value) VALUES (?, ?, ?, ?)');
      for (const pr of prices) {
        insertPrice.run(productId, pr.type, pr.label, pr.value);
      }
    }

    res.json({ id: productId, message: 'Produto cadastrado com sucesso' });
  } catch (err) {
    console.error('Erro ao cadastrar produto no catálogo:', err);
    res.status(500).json({ message: 'Erro interno ao cadastrar produto.', error: err.message });
  }
});

app.put('/api/catalog/:id', authenticateToken, (req, res) => {
  try {
    const { name, description, image_data, base_cost, variations, prices } = req.body;
    const productId = req.params.id;

    if (!name) return res.status(400).json({ message: 'Nome do produto obrigatório.' });

    const transaction = db.transaction(() => {
      // 1. Update Product Basic Info
      db.prepare(`
        UPDATE catalog_products 
        SET name = ?, description = ?, image_data = ?, base_cost = ?
        WHERE id = ?
      `).run(
        name,
        description || '',
        image_data || null,
        Number(base_cost) || 0,
        productId
      );

      // 2. Variations
      if (Array.isArray(variations)) {
        const existingVars = db.prepare('SELECT * FROM variations WHERE product_id = ?').all(productId);
        const newVarKeys = variations.map(v => `${v.color}|${v.size}`);
        for (const ev of existingVars) {
          const key = `${ev.color}|${ev.size}`;
          if (!newVarKeys.includes(key)) db.prepare('DELETE FROM variations WHERE id = ?').run(ev.id);
        }
        const insertVar = db.prepare('INSERT INTO variations (product_id, color, size, sku) VALUES (?, ?, ?, ?)');
        const updateVar = db.prepare('UPDATE variations SET sku = ? WHERE id = ?');
        for (const nv of variations) {
          const existing = existingVars.find(ev => ev.color === nv.color && ev.size === nv.size);
          if (existing) { if (existing.sku !== nv.sku) updateVar.run(nv.sku, existing.id); }
          else { insertVar.run(productId, nv.color || '', nv.size || '', nv.sku || ''); }
        }
      }

      // 3. Prices
      if (Array.isArray(prices)) {
        db.prepare('DELETE FROM product_prices WHERE product_id = ?').run(productId);
        const insertPrice = db.prepare('INSERT INTO product_prices (product_id, type, label, value) VALUES (?, ?, ?, ?)');
        for (const pr of prices) {
          insertPrice.run(productId, pr.type, pr.label, pr.value);
        }
      }
    });

    transaction();
    res.json({ message: 'Produto atualizado com sucesso' });
  } catch (err) {
    console.error('Erro ao atualizar produto do catálogo:', err);
    res.status(500).json({ message: 'Erro interno ao atualizar produto.', error: err.message });
  }
});

app.delete('/api/catalog/:id', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM catalog_products WHERE id = ?').run(req.params.id);
  res.json({ message: 'Produto removido do catálogo' });
});

// Adicionar novo ponto de preço (incluindo margens) a um produto existente no catálogo
app.post('/api/catalog/:id/prices', authenticateToken, (req, res) => {
  try {
    const { type, label, value, cost, profit } = req.body;
    const productId = req.params.id;
    const { company_id } = req.user;

    if (!type || value === undefined) {
      return res.status(400).json({ message: 'Tipo e Valor são obrigatórios.' });
    }

    // Segurança: Verificar se o produto pertence à empresa do usuário
    const product = db.prepare('SELECT id FROM catalog_products WHERE id = ? AND company_id = ?').get(productId, company_id);
    if (!product) {
      return res.status(403).json({ message: 'Acesso negado: Produto não pertence à sua empresa.' });
    }

    // --- UPSERT LOGIC (Update if label exists for this product) ---
    const finalLabel = label || 'Geral';
    const existingPrice = db.prepare('SELECT id FROM product_prices WHERE product_id = ? AND label = ?').get(productId, finalLabel);

    if (existingPrice) {
      db.prepare('UPDATE product_prices SET type = ?, value = ?, cost = ?, profit = ? WHERE id = ?')
        .run(type, Number(value), Number(cost || 0), Number(profit || 0), existingPrice.id);
    } else {
      db.prepare('INSERT INTO product_prices (product_id, type, label, value, cost, profit) VALUES (?, ?, ?, ?, ?, ?)')
        .run(productId, type, finalLabel, Number(value), Number(cost || 0), Number(profit || 0));
    }

    // Opcional: Atualizar o base_cost do produto se estiver em branco ou mudar
    if (cost > 0) {
      db.prepare('UPDATE catalog_products SET base_cost = ? WHERE id = ? AND base_cost = 0').run(Number(cost), productId);
    }

    res.json({ message: 'Preço e margens atualizados com sucesso no catálogo!' });
  } catch (err) {
    console.error('Erro ao adicionar preço:', err);
    res.status(500).json({ message: 'Erro interno ao salvar preço. ' + err.message });
  }
});

// Remover preço salvo na gestão de preços
app.delete('/api/prices/:id', authenticateToken, (req, res) => {
  try {
    const { company_id } = req.user;
    const priceId = req.params.id;

    // Verificar se o preço pertence a um produto da empresa (segurança)
    const price = db.prepare(`
      SELECT pp.id FROM product_prices pp
      JOIN catalog_products p ON pp.product_id = p.id
      WHERE pp.id = ? AND p.company_id = ?
    `).get(priceId, company_id);

    if (!price) {
      return res.status(403).json({ message: 'Acesso negado ou preço não encontrado.' });
    }

    db.prepare('DELETE FROM product_prices WHERE id = ?').run(priceId);
    res.json({ message: 'Preço removido com sucesso!' });
  } catch (err) {
    console.error('Erro ao remover preço:', err);
    res.status(500).json({ message: 'Erro interno ao remover preço.' });
  }
});

// Stock Management Routes
app.put('/api/stock', authenticateToken, (req, res) => {
  try {
    const stockUpdates = req.body; // Array of { id: <variation_id>, stock: <new_stock> }

    if (!Array.isArray(stockUpdates)) {
      return res.status(400).json({ message: 'Formato inválido. Esperado um array de atualizações.' });
    }

    const updateStmt = db.prepare('UPDATE variations SET stock = ? WHERE id = ?');

    // Process all updates in a single transaction
    const transaction = db.transaction((updates) => {
      for (const update of updates) {
        if (update.id && typeof update.stock === 'number') {
          updateStmt.run(update.stock, update.id);
        }
      }
    });

    transaction(stockUpdates);

    res.json({ message: 'Estoque atualizado com sucesso!' });
  } catch (err) {
    console.error('Erro ao atualizar estoque:', err);
    res.status(500).json({ message: 'Erro interno ao atualizar estoque.', error: err.message });
  }
});

// Campaign Routes
app.get('/api/campaigns', authenticateToken, (req, res) => {
  const { company_id } = req.user;
  const campaigns = db.prepare(`
    SELECT c.*, m.name as marketplace_name 
    FROM campaigns c 
    LEFT JOIN marketplaces m ON c.marketplace_id = m.id 
    WHERE c.company_id = ? 
    ORDER BY c.created_at DESC
  `).all(company_id);

  const enhanced = campaigns.map(c => {
    let mktName = null;
    if (c.marketplace_id) {
        const m = db.prepare('SELECT name FROM marketplaces WHERE id = ?').get(c.marketplace_id);
        if (m) mktName = m.name;
    }

    // Lookup associated products via inner join, fetching marketplace specific prices if available
    const products = db.prepare(`
        SELECT cp.product_id, p.name, p.image_data, 
               COALESCE(pp.cost, p.base_cost) as base_cost, 
               COALESCE(pp.value, p.sale_price) as sale_price 
        FROM campaign_products cp 
        JOIN catalog_products p ON cp.product_id = p.id 
        LEFT JOIN product_prices pp ON pp.product_id = p.id AND pp.label = ?
        WHERE cp.campaign_id = ?
    `).all(mktName, c.id);
    return { ...c, products };
  });

  res.json(enhanced);
});

app.post('/api/campaigns', authenticateToken, (req, res) => {
  try {
    const { company_id } = req.user;
    const { name, marketplace_id, start_date, end_date, discount_percent, discount_fixed, selected_products } = req.body;

    if (!name) return res.status(400).json({ message: 'Nome da campanha obrigatório.' });

    const insertCamp = db.prepare(`
        INSERT INTO campaigns (company_id, name, marketplace_id, start_date, end_date, discount_percent, discount_fixed) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const info = insertCamp.run(
      company_id,
      name,
      marketplace_id || null,
      start_date || null,
      end_date || null,
      Number(discount_percent) || 0,
      Number(discount_fixed) || 0
    );

    const campId = info.lastInsertRowid;

    if (Array.isArray(selected_products) && selected_products.length > 0) {
      const insertProd = db.prepare('INSERT INTO campaign_products (campaign_id, product_id) VALUES (?, ?)');
      for (const pid of selected_products) {
        try { insertProd.run(campId, Number(pid)); } catch (e) { }
      }
    }

    res.json({ id: campId, message: 'Campanha salva com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro salvar campanha', error: err.message });
  }
});

app.put('/api/campaigns/:id', authenticateToken, (req, res) => {
  try {
    const { name, marketplace_id, start_date, end_date, discount_percent, discount_fixed, selected_products } = req.body;
    const campId = req.params.id;

    if (!name) return res.status(400).json({ message: 'Nome da campanha obrigatório.' });

    const updateCamp = db.prepare(`
        UPDATE campaigns 
        SET name = ?, marketplace_id = ?, start_date = ?, end_date = ?, discount_percent = ?, discount_fixed = ?
        WHERE id = ?
    `);

    updateCamp.run(
      name,
      marketplace_id || null,
      start_date || null,
      end_date || null,
      Number(discount_percent) || 0,
      Number(discount_fixed) || 0,
      campId
    );

    // Replace products
    db.prepare('DELETE FROM campaign_products WHERE campaign_id = ?').run(campId);

    if (Array.isArray(selected_products) && selected_products.length > 0) {
      const insertProd = db.prepare('INSERT INTO campaign_products (campaign_id, product_id) VALUES (?, ?)');
      for (const pid of selected_products) {
        try { insertProd.run(campId, Number(pid)); } catch (e) { }
      }
    }

    res.json({ message: 'Campanha atualizada com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro atualizar campanha', error: err.message });
  }
});

app.delete('/api/campaigns/:id', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM campaigns WHERE id = ?').run(req.params.id);
  res.json({ message: 'Campanha removida' });
});

// Sales & Import Routes
app.post('/api/sales/import', authenticateToken, (req, res) => {
  try {
    const { company_id } = req.user;
    const { sale_date, items } = req.body;
    // items should be [{ sku: 'SKU_123', quantity: 3 }, ...]

    if (!sale_date || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Data ou itens inválidos para importação.' });
    }

    const checkVariation = db.prepare(`
        SELECT v.id, v.stock 
        FROM variations v 
        JOIN catalog_products p ON v.product_id = p.id 
        WHERE v.sku = ? COLLATE NOCASE AND p.company_id = ?
    `);
    const updateStock = db.prepare('UPDATE variations SET stock = stock - ? WHERE id = ?');

    const checkSale = db.prepare('SELECT id, quantity FROM sales WHERE sale_date = ? AND variation_id = ? AND company_id = ?');
    const updateSale = db.prepare('UPDATE sales SET quantity = quantity + ? WHERE id = ?');
    const insertSale = db.prepare('INSERT INTO sales (company_id, sale_date, variation_id, quantity) VALUES (?, ?, ?, ?)');

    const transaction = db.transaction((itemsList) => {
      let processedCount = 0;
      let notFoundSkus = [];

      for (const item of itemsList) {
        if (!item.sku) continue;
        const v = checkVariation.get(item.sku, company_id);
        if (!v) {
          if (!notFoundSkus.includes(item.sku)) notFoundSkus.push(item.sku);
          continue;
        }

        updateStock.run(item.quantity, v.id);

        const existingSale = checkSale.get(sale_date, v.id, company_id);
        if (existingSale) {
          updateSale.run(item.quantity, existingSale.id);
        } else {
          insertSale.run(company_id, sale_date, v.id, item.quantity);
        }

        processedCount += item.quantity;
      }
      return { processedCount, notFoundSkus };
    });

    const result = transaction(items);

    res.json({
      message: 'Importação processada com sucesso!',
      processed: result.processedCount,
      notFound: result.notFoundSkus
    });

  } catch (err) {
    console.error('Erro na importação de vendas:', err);
    res.status(500).json({ message: 'Erro interno na baixa do estoque.', error: err.message });
  }
});

app.post('/api/sales/scan', authenticateToken, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { company_id } = req.user;
    const { sku, marketplace_id } = req.body;
    
    if (!sku) return res.status(400).json({ message: 'SKU não fornecido.' });
    if (!marketplace_id) return res.status(400).json({ message: 'Selecione uma loja/marketplace primeiro.' });

    // 1. Find the variation and product
    const variation = db.prepare(`
        SELECT v.id, v.stock, v.color, v.size, p.id as product_id, p.name, p.base_cost
        FROM variations v 
        JOIN catalog_products p ON v.product_id = p.id 
        WHERE v.sku = ? COLLATE NOCASE AND p.company_id = ?
    `).get(sku, company_id);

    if (!variation) return res.status(404).json({ message: 'SKU não encontrado.' });
    if (variation.stock <= 0) return res.status(400).json({ message: `Estoque esgotado para: ${variation.name}` });

    // 2. Identify Marketplace Name
    const marketplace = db.prepare('SELECT name FROM marketplaces WHERE id = ? AND company_id = ?').get(marketplace_id, company_id);
    if (!marketplace) return res.status(404).json({ message: 'Lojista/Marketplace não encontrado.' });

    // 3. Find the specific price for this marketplace
    let priceData = db.prepare('SELECT value, cost, profit FROM product_prices WHERE product_id = ? AND label = ?')
                      .get(variation.product_id, marketplace.name);
    
    // Fallback to 'Preço Base' or first available if not found
    if (!priceData) {
        priceData = db.prepare('SELECT value, cost, profit FROM product_prices WHERE product_id = ? LIMIT 1').get(variation.product_id);
    }

    const price  = priceData ? priceData.value : 0;
    const cost   = priceData ? priceData.cost : variation.base_cost;
    const profit = priceData ? priceData.profit : (price - cost);

    const transaction = db.transaction(() => {
      // Deduct stock
      db.prepare('UPDATE variations SET stock = stock - 1 WHERE id = ?').run(variation.id);

      // Record sale with financial snapshot
      db.prepare(`
        INSERT INTO sales (company_id, sale_date, variation_id, quantity, marketplace_id, unit_price, unit_cost, unit_profit) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(company_id, today, variation.id, 1, marketplace_id, price, cost, profit);
    });

    transaction();

    res.json({
      message: 'Venda registrada!',
      product: { 
        name: variation.name, 
        color: variation.color, 
        size: variation.size, 
        newStock: variation.stock - 1,
        price: price.toFixed(2),
        marketplace: marketplace.name
      }
    });

  } catch (err) {
    console.error('Erro no checkout via scan:', err);
    res.status(500).json({ message: 'Erro ao processar venda.', error: err.message });
  }
});

app.post('/api/production/scan', authenticateToken, (req, res) => {
  try {
    const { company_id } = req.user;
    const { sku } = req.body;
    if (!sku) return res.status(400).json({ message: 'SKU não fornecido.' });

    const today = new Date().toISOString().split('T')[0];

    // Find variation and ensure it belongs to the company
    const variation = db.prepare(`
        SELECT v.id, v.stock, v.color, v.size, p.name 
        FROM variations v 
        JOIN catalog_products p ON v.product_id = p.id 
        WHERE v.sku = ? COLLATE NOCASE AND p.company_id = ?
    `).get(sku, company_id);

    if (!variation) {
      return res.status(404).json({ message: 'SKU não encontrado no catálogo.' });
    }

    const transaction = db.transaction(() => {
      // Add 1 to stock (Production Entry)
      db.prepare('UPDATE variations SET stock = stock + 1 WHERE id = ?').run(variation.id);

      // Record entry
      const existingEntry = db.prepare('SELECT id FROM production_entries WHERE entry_date = ? AND variation_id = ? AND company_id = ?').get(today, variation.id, company_id);
      if (existingEntry) {
        db.prepare('UPDATE production_entries SET quantity = quantity + 1 WHERE id = ?').run(existingEntry.id);
      } else {
        db.prepare('INSERT INTO production_entries (company_id, entry_date, variation_id, quantity) VALUES (?, ?, ?, ?)').run(company_id, today, variation.id, 1);
      }
    });

    transaction();

    res.json({
      message: 'Entrada de produção registrada!',
      product: { name: variation.name, color: variation.color, size: variation.size, newStock: variation.stock + 1 }
    });

  } catch (err) {
    console.error('Erro na entrada de produção via scan:', err);
    res.status(500).json({ message: 'Erro ao processar entrada.', error: err.message });
  }
});

app.get('/api/production', authenticateToken, (req, res) => {
  const { company_id, role } = req.user;
  const entries = db.prepare(`
          SELECT e.id, e.entry_date, e.quantity, 
                 v.color, v.size, v.sku, 
                 p.name, p.image_data, p.sale_price, p.base_cost
          FROM production_entries e
          JOIN variations v ON e.variation_id = v.id
          JOIN catalog_products p ON v.product_id = p.id
          WHERE e.company_id = ?
          ORDER BY e.entry_date DESC
     `).all(company_id);

  res.json(entries);
});

app.get('/api/sales', authenticateToken, (req, res) => {
  const { company_id } = req.user;
  const query = `
      SELECT s.id, s.sale_date, s.quantity, s.marketplace_id,
             s.unit_price, s.unit_cost, s.unit_profit,
             v.color, v.size, v.sku,
             p.name, p.image_data, p.base_cost,
             m.name as marketplace_name
      FROM sales s
      JOIN variations v ON s.variation_id = v.id
      JOIN catalog_products p ON v.product_id = p.id
      LEFT JOIN marketplaces m ON s.marketplace_id = m.id
      WHERE s.company_id = ?
      ORDER BY s.sale_date DESC, s.created_at DESC
  `;

  const sales = db.prepare(query).all(company_id);
  res.json(sales);
});

// Marketplace Endpoints
app.get('/api/marketplaces', authenticateToken, (req, res) => {
  const { company_id } = req.user;
  const marketplaces = db.prepare('SELECT * FROM marketplaces WHERE company_id = ? ORDER BY name ASC').all(company_id);
  res.json(marketplaces);
});

app.post('/api/marketplaces', authenticateToken, (req, res) => {
  const { company_id } = req.user;
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Nome é obrigatório.' });

  try {
    db.prepare('INSERT INTO marketplaces (company_id, name) VALUES (?, ?)').run(company_id, name);
    res.json({ message: 'Canal cadastrado com sucesso.' });
  } catch (e) {
    res.status(500).json({ message: 'Erro ao cadastrar canal.' });
  }
});

app.delete('/api/marketplaces/:id', authenticateToken, (req, res) => {
  const { company_id } = req.user;
  const { id } = req.params;
  db.prepare('DELETE FROM marketplaces WHERE id = ? AND company_id = ?').run(id, company_id);
  res.json({ message: 'Canal excluído.' });
});

app.get('/api/analysis/profit', authenticateToken, (req, res) => {
  try {
    const { company_id } = req.user;
    const today = new Date().toISOString().split('T')[0];

    // 1. Fetch products
    const products = db.prepare(`
        SELECT p.id, p.name, p.base_cost, p.image_data
        FROM catalog_products p
        WHERE p.company_id = ?
    `).all(company_id);

    // 2. Fetch sales by product
    const sales = db.prepare(`
        SELECT s.sale_date, s.quantity, v.product_id
        FROM sales s
        JOIN variations v ON s.variation_id = v.id
        WHERE s.company_id = ?
    `).all(company_id);

    // 3. Fetch campaigns and their active products
    const campaigns = db.prepare(`
        SELECT c.*, cp.product_id
        FROM campaigns c
        JOIN campaign_products cp ON c.id = cp.campaign_id
        WHERE c.company_id = ?
    `).all(company_id);

    if (!products.length) return res.json({ products: [], summary: {} });

    let globalRevenue = 0;
    let globalCost = 0;
    let globalUnits = 0;

    const results = products.map(p => {
      const pSales = sales.filter(s => s.product_id === p.id);
      const pCampaigns = campaigns.filter(c => c.product_id === p.id);
      const pPrices = db.prepare('SELECT * FROM product_prices WHERE product_id = ?').all(p.id);
      const bestPriceEntry = pPrices.find(pr => pr.type === 'marketplace') || pPrices[0];
      const basePrice = bestPriceEntry?.value || 0;
      // Custo REAL = base_cost + impostos + taxas (salvo pela Calculadora em product_prices.cost)
      const realCost = (bestPriceEntry && bestPriceEntry.cost > 0) ? bestPriceEntry.cost : p.base_cost;

      let totalRevenue = 0;
      let totalUnits = 0;

      pSales.forEach(s => {
        let effectivePrice = basePrice;

        // Check if this sale date falls in a campaign
        const activeCampaign = pCampaigns.find(c => s.sale_date >= c.start_date && s.sale_date <= c.end_date);
        if (activeCampaign) {
          if (activeCampaign.discount_percent) {
            effectivePrice *= (1 - activeCampaign.discount_percent / 100);
          } else if (activeCampaign.discount_fixed) {
            effectivePrice -= activeCampaign.discount_fixed;
          }
        }

        totalRevenue += effectivePrice * s.quantity;
        totalUnits += s.quantity;
      });

      // Totais usando custo REAL (com todas as taxas e impostos incluídos)
      const totalCost = realCost * totalUnits;
      const netProfit = totalRevenue - totalCost;

      // "Currently" active campaign for suggestion logic
      const currentCampaign = pCampaigns.find(c => today >= c.start_date && today <= c.end_date);
      let currentEffectivePrice = basePrice;
      if (currentCampaign) {
        if (currentCampaign.discount_percent) currentEffectivePrice *= (1 - currentCampaign.discount_percent / 100);
        else if (currentCampaign.discount_fixed) currentEffectivePrice -= currentCampaign.discount_fixed;
      }
      globalRevenue += totalRevenue;
      globalCost += totalCost;
      globalUnits += totalUnits;

      // Lucro líquido = preço de venda - custo real (com TODAS as taxas/impostos)
      const currentProfitReais = currentEffectivePrice - realCost;
      const currentProfitPercent = currentEffectivePrice > 0 ? (currentProfitReais / currentEffectivePrice) * 100 : 0;

      return {
        id: p.id,
        name: p.name,
        image_data: p.image_data,
        base_cost: p.base_cost,
        real_cost: realCost,
        prices: pPrices,
        current_effective_price: currentEffectivePrice,
        total_sold: totalUnits,
        profitReais: currentProfitReais, // Profit per piece TODAY
        profitPercent: currentProfitPercent, // Profit margin TODAY
        is_campaign: !!currentCampaign
      };
    });

    const avgSold = globalUnits / products.length;
    const sumMargins = results.reduce((acc, p) => acc + p.profitPercent, 0);
    const portfolioMargin = products.length > 0 ? (sumMargins / products.length) : 0;

    // Suggestion logic based on volume and CURRENT margin
    const finalProducts = results.map(p => {
      let suggestion = "Manter";
      let status = "Estável";
      let color = "var(--text-muted)";

      if (p.total_sold > avgSold * 1.5) {
        status = "Alta Saída 🔥";
        if (p.profitPercent < 25) {
          suggestion = "Subir Preço (+10%)";
          color = "var(--success)";
        } else {
          suggestion = "Lucro Ótimo";
          color = "var(--primary)";
        }
      } else if (p.total_sold < avgSold * 0.5 || p.total_sold === 0) {
        status = "Baixa Saída 🧊";
        if (p.profitPercent > 15) {
          suggestion = "Baixar Preço (-10%)";
          color = "var(--danger)";
        } else {
          suggestion = "Liquidar / Promoção";
          color = "var(--danger)";
        }
      }

      if (p.is_campaign) status = "Em Campanha 📢";

      return { ...p, status, suggestion, suggestionColor: color };
    }).sort((a, b) => b.profitReais - a.profitReais);

    res.json({
      products: finalProducts,
      summary: {
        portfolioMargin: portfolioMargin.toFixed(1),
        totalUnits: globalUnits,
        topPerformer: finalProducts[0]?.name || "Nenhum",
        avgSold: avgSold.toFixed(1)
      }
    });

  } catch (err) {
    console.error('Erro na análise de lucro dinâmica:', err);
    res.status(500).json({ message: 'Erro ao processar análise dinâmica.', error: err.message });
  }
});

// =====================
// WHOLSEALE & CUSTOMERS
// =====================

// Customers CRUD
app.get('/api/customers', authenticateToken, (req, res) => {
  const { company_id } = req.user;
  const customers = db.prepare('SELECT * FROM customers WHERE company_id = ? ORDER BY name ASC').all(company_id);
  res.json(customers);
});

app.post('/api/customers', authenticateToken, (req, res) => {
  const { company_id } = req.user;
  const { name, phone, email, address } = req.body;
  if (!name) return res.status(400).json({ message: 'Nome é obrigatório' });
  
  const info = db.prepare('INSERT INTO customers (company_id, name, phone, email, address) VALUES (?, ?, ?, ?, ?)')
    .run(company_id, name, phone || '', email || '', address || '');
    
  res.json({ id: info.lastInsertRowid, message: 'Cliente cadastrado' });
});

app.delete('/api/customers/:id', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  res.json({ message: 'Cliente removido' });
});

// Wholesale Orders
app.get('/api/wholesale/orders', authenticateToken, (req, res) => {
  const { company_id } = req.user;
  const orders = db.prepare(`
    SELECT o.*, c.name as customer_name, c.phone as customer_phone
    FROM wholesale_orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE o.company_id = ?
    ORDER BY o.created_at DESC
  `).all(company_id);

  const enhanced = orders.map(o => {
    const items = db.prepare(`
      SELECT oi.*, p.name as product_name, v.color, v.size, v.sku
      FROM wholesale_order_items oi
      JOIN variations v ON oi.variation_id = v.id
      JOIN catalog_products p ON v.product_id = p.id
      WHERE oi.order_id = ?
    `).all(o.id);
    return { ...o, items };
  });

  res.json(enhanced);
});

app.post('/api/wholesale/orders', authenticateToken, (req, res) => {
  const { company_id } = req.user;
  const { customer_id, items, total_amount } = req.body;

  if (!items || items.length === 0) return res.status(400).json({ message: 'Pedido vazio' });

  const transaction = db.transaction(() => {
    const info = db.prepare('INSERT INTO wholesale_orders (company_id, customer_id, total_amount) VALUES (?, ?, ?)')
      .run(company_id, customer_id || null, total_amount);
    
    const orderId = info.lastInsertRowid;
    const itemStmt = db.prepare('INSERT INTO wholesale_order_items (order_id, variation_id, quantity, unit_price) VALUES (?, ?, ?, ?)');
    
    for (const item of items) {
      itemStmt.run(orderId, item.variation_id, item.quantity, item.unit_price);
      // Não abate estoque: Atacado é produzido sob demanda
    }
    
    const order = db.prepare('SELECT * FROM wholesale_orders WHERE id = ?').get(orderId);
    return order;
  });

  try {
    const freshOrder = transaction();
    res.json({ message: 'Pedido de Venda por Atacado registrado', order: freshOrder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao criar venda atacado', error: err.message });
  }
});

app.delete('/api/wholesale/orders/:id', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM wholesale_orders WHERE id = ?').run(req.params.id);
  res.json({ message: 'Pedido removido' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('\x1b[32m%s\x1b[0m', '---------------------------------------------------');
  console.log('\x1b[32m%s\x1b[0m', '🚀 ProfitCalc POS Online e Pronto para Ngrok!');
  console.log('\x1b[32m%s\x1b[0m', '---------------------------------------------------');
  console.log(`💻 Local: http://localhost:${PORT}`);
  console.log(`🌍 No terminal, execute: ngrok http ${PORT}`);
  console.log('\x1b[32m%s\x1b[0m', '---------------------------------------------------');
});
