const API_URL = '/api';

// State
let catalog = [];
let currentImageData = null;
let editingCatalogId = null;
let editingCampaignId = null;

// DOM - Auth
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const userDisplay = document.getElementById('user-name-display');

// DOM - Nav
const navCalc = document.getElementById('nav-calc');
const navPrices = document.getElementById('nav-prices');
const navCatalog = document.getElementById('nav-catalog');
const navStock = document.getElementById('nav-stock');
const navCampaigns = document.getElementById('nav-campaigns');
const navProduction = document.getElementById('nav-production');
const navAnalysis = document.getElementById('nav-analysis');
const navSales = document.getElementById('nav-sales');
const navMarketplaces = document.getElementById('nav-marketplaces');
const navLabels = document.getElementById('nav-labels');
const navPos = document.getElementById('nav-pos');
const navWholesaleCart = document.getElementById('nav-wholesale-cart');
const navCustomers = document.getElementById('nav-customers');
const navWholesaleOrders = document.getElementById('nav-wholesale-orders');
const sidebarToggle = document.getElementById('mobile-sidebar-toggle');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const userNameDisplay = document.getElementById('user-name-display');

const calcView = document.getElementById('calc-view');
const pricesView = document.getElementById('prices-view');
const pricesTableBody = document.getElementById('prices-table-body');
const catalogView = document.getElementById('catalog-view');
const stockView = document.getElementById('stock-view');
const campaignsView = document.getElementById('campaigns-view');
const productionView = document.getElementById('production-view');
const analysisView = document.getElementById('analysis-view');
const salesView = document.getElementById('sales-view');
const marketplacesView = document.getElementById('marketplaces-view');
const labelsView = document.getElementById('labels-view');
const posView = document.getElementById('pos-view');
const customersView = document.getElementById('customers-view');
const wholesalePosView = document.getElementById('wholesale-pos-view');
const wholesaleOrdersView = document.getElementById('wholesale-orders-view');

// DOM - Calculator
const calcForm = document.getElementById('calc-form');
const pCalcCatalogId = document.getElementById('p-calc-catalog-id');
const pCalcLabel = document.getElementById('p-calc-label');
const resCost = document.getElementById('res-cost');
const resProfit = document.getElementById('res-profit');

// DOM - Catalog
const btnAddCatalog = document.getElementById('btn-add-catalog');
const catalogModal = document.getElementById('catalog-modal');
const closeModal = document.querySelector('.close-modal');
const catalogForm = document.getElementById('catalog-form');
const catalogGrid = document.getElementById('catalog-grid');
const imageInput = document.getElementById('cat-image');
const imagePreviewBox = document.getElementById('image-preview-box');
const variationsMatrix = document.getElementById('variations-matrix');
const btnGenVariations = document.getElementById('btn-gen-variations');

// DOM - Stock
const stockGrid = document.getElementById('stock-grid');
const stockModal = document.getElementById('stock-modal');
const closeStockModal = document.querySelector('.close-stock-modal');
const stockForm = document.getElementById('stock-form');
const stockProductName = document.getElementById('stock-product-name');
const stockModalBody = document.getElementById('stock-modal-body');

// DOM - Campaigns
const campaignsGrid = document.getElementById('campaigns-grid');
const btnAddCampaign = document.getElementById('btn-add-campaign');
const campaignModal = document.getElementById('campaign-modal');
const closeCampaignModal = document.querySelector('.close-campaign-modal');
const campaignForm = document.getElementById('campaign-form');
const campProductsList = document.getElementById('camp-products-list');
let campaigns = [];

// DOM - Sales
const salesImportForm = document.getElementById('sales-import-form');
const salesGrid = document.getElementById('sales-grid');
let salesData = [];

// DOM - Labels
const labelsListView = document.getElementById('labels-list-view');
const labelsDetailView = document.getElementById('labels-detail-view');
const labelsContainer = document.getElementById('labels-container');
const labelsDetailGrid = document.getElementById('labels-detail-grid');
const detailProductName = document.getElementById('detail-product-name');
const labelWidthMm = document.getElementById('label-width-mm');
const labelHeightMm = document.getElementById('label-height-mm');
const printStagingArea = document.getElementById('print-staging-area');

// DOM - POS
const posInput = document.getElementById('pos-barcode-input');
const posLog = document.getElementById('pos-log');
const posFeedback = document.getElementById('pos-feedback');
const posLight = document.getElementById('pos-status-light');
const posMarketplaceSelect = document.getElementById('pos-marketplace-select');
let posHistory = [];

// DOM - Wholesale Cart & Customers
const cartSearchInput = document.getElementById('cart-search-input');
const cartProductGrid = document.getElementById('cart-product-grid');
const cartSidebar = document.getElementById('cart-sidebar');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartTotalValue = document.getElementById('cart-total-value');
const customerSelect = document.getElementById('cart-customer-select');
const customersTableBody = document.getElementById('customers-table-body');
const customerForm = document.getElementById('customer-form');
const wholesaleOrdersTable = document.getElementById('wholesale-orders-table-body');
const viewCartBtn = document.getElementById('view-cart-btn');
const variationModal = document.getElementById('variation-modal');

let currentCart = [];
let customers = [];

// DOM - Marketplaces
const marketplaceForm = document.getElementById('marketplace-form');
const marketplacesGrid = document.getElementById('marketplaces-grid');
let marketplaces = [];

// DOM - Analysis Channel
const channelAnalysisGrid = document.getElementById('channel-analysis-grid');

// DOM - Production
const prodInput = document.getElementById('prod-barcode-input');
const prodLog = document.getElementById('prod-log');
const prodFeedback = document.getElementById('prod-feedback');
const prodLight = document.getElementById('prod-status-light');
let prodHistory = [];

// Print state
let isDoubleColumn = false;

let html5QrCode = null;
let currentCameraFacing = "environment";

// =====================
// INIT
// =====================
function init() {
    const token = localStorage.getItem('token');
    if (token) {
        const storedName = localStorage.getItem('companyName');
        if (storedName && userDisplay) userDisplay.textContent = storedName;
        showView('dashboard');
        loadCatalog();
    } else {
        showView('login');
    }
}

function showView(view) {
    if (view === 'login') {
        loginView.classList.add('active');
        dashboardView.classList.remove('active');
    } else {
        loginView.classList.remove('active');
        dashboardView.classList.add('active');
    }
}

function switchSubView(view) {
    console.log(`Navigating to: ${view}`);
    // Reset all sub-views and nav links
    const allViews = [calcView, pricesView, catalogView, stockView, campaignsView, productionView, analysisView, salesView, marketplacesView, labelsView, posView, customersView, wholesalePosView, wholesaleOrdersView];
    const allNavs = [navCalc, navPrices, navCatalog, navStock, navCampaigns, navProduction, navAnalysis, navSales, navMarketplaces, navLabels, navPos, navWholesaleCart, navCustomers, navWholesaleOrders];
    
    allViews.forEach(v => v?.classList.remove('active'));
    allNavs.forEach(n => n?.classList.remove('active'));
    
    // Activate target
    const viewMap = {
        'calc': [calcView, navCalc],
        'prices': [pricesView, navPrices],
        'catalog': [catalogView, navCatalog],
        'stock': [stockView, navStock],
        'campaigns': [campaignsView, navCampaigns],
        'production': [productionView, navProduction],
        'analysis': [analysisView, navAnalysis],
        'sales': [salesView, navSales],
        'marketplaces': [marketplacesView, navMarketplaces],
        'labels': [labelsView, navLabels],
        'pos': [posView, navPos],
        'wholesale-cart': [wholesalePosView, navWholesaleCart],
        'customers': [customersView, navCustomers],
        'wholesale-orders': [wholesaleOrdersView, navWholesaleOrders]
    };

    if (viewMap[view]) {
        const [v, n] = viewMap[view];
        if (v) v.classList.add('active');
        if (n) n.classList.add('active');
        
        // Scroll main content to top
        const mainContent = document.getElementById('main-content');
        if (mainContent) mainContent.scrollTop = 0;
    }

    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 1024) {
        dashboardView.classList.remove('sidebar-open');
    }

    // Sub-view specific init (Force data refresh)
    try {
        if (view === 'catalog' || view === 'stock') loadCatalog();
        if (view === 'campaigns' && typeof loadCampaigns === 'function') loadCampaigns();
        if (view === 'analysis' && typeof loadProfitAnalysis === 'function') loadProfitAnalysis();
        if (view === 'sales' && typeof loadSales === 'function') loadSales();
        if (view === 'marketplaces' || view === 'pos') loadMarketplaces();
        if (view === 'production' && typeof initProduction === 'function') initProduction();
        if (view === 'labels' && typeof loadLabels === 'function') loadLabels();
        if (view === 'pos' && typeof initPOS === 'function') initPOS();
        if (view === 'calc') populateCalcCatalogSelect();
        if (view === 'prices') loadPricesView();
        if (view === 'customers') loadCustomers();
        if (view === 'wholesale-cart') loadWholesaleProducts();
        if (view === 'wholesale-orders') loadWholesaleOrders();
    } catch (err) {
        console.error(`Error loading data for view ${view}:`, err);
    }
}

navCalc.onclick = () => switchSubView('calc');
navPrices.onclick = () => switchSubView('prices');
navCatalog.onclick = () => switchSubView('catalog');
navStock.onclick = () => switchSubView('stock');
navCampaigns.onclick = () => switchSubView('campaigns');
navProduction.onclick = () => switchSubView('production');
navAnalysis.onclick = () => switchSubView('analysis');
navSales.onclick = () => switchSubView('sales');
navMarketplaces.onclick = () => switchSubView('marketplaces');
navLabels.onclick = () => switchSubView('labels');
navPos.onclick = () => switchSubView('pos');
navWholesaleCart.onclick = () => switchSubView('wholesale-cart');
navCustomers.onclick = () => switchSubView('customers');
navWholesaleOrders.onclick = () => switchSubView('wholesale-orders');

// Sidebar Toggle
if (sidebarToggle) {
    sidebarToggle.onclick = () => {
        dashboardView.classList.toggle('sidebar-open');
    };
}

// Sidebar Overlay Click (Mobile)
if (sidebarOverlay) {
    sidebarOverlay.onclick = () => {
        dashboardView.classList.remove('sidebar-open');
    };
}

// Close sidebar or modals when clicking outside
document.addEventListener('click', (e) => {
    // Sidebar logic
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth <= 1024 && 
        dashboardView.classList.contains('sidebar-open') && 
        !sidebar.contains(e.target) && 
        e.target !== sidebarToggle &&
        e.target !== sidebarOverlay) {
        dashboardView.classList.remove('sidebar-open');
    }

    // Modals logic
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
        if (typeof stopCameraScanner === 'function') stopCameraScanner();
    }
});

// =====================
// LOGIN / LOGOUT
// =====================
loginForm.onsubmit = async (e) => {
    e.preventDefault();
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: e.target.username.value, password: e.target.password.value })
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('companyName', data.company_name);
            userDisplay.textContent = data.company_name;
            showView('dashboard');
            loadCatalog();
        } else {
            loginError.textContent = data.message;
        }
    } catch (err) {
        loginError.textContent = 'Erro ao conectar ao servidor';
    }
};

logoutBtn.onclick = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('companyName');
    showView('login');
};

// =====================
// CALCULATOR
// =====================
['p-cost','p-price','p-tax-p','p-tax-p-fixed','p-tax-f','p-costs'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.oninput = updatePreview;
});

function parsePrice(val) {
    if (!val) return 0;
    // Replace comma with dot and remove anything that isn't a digit or dot
    const clean = val.toString().replace(',', '.').replace(/[^\d.]/g, '');
    return parseFloat(clean) || 0;
}

function updatePreview() {
    const p_cost  = parsePrice(document.getElementById('p-cost').value);
    const s_price = parsePrice(document.getElementById('p-price').value);
    const t_p     = parsePrice(document.getElementById('p-tax-p').value);
    const t_f_p   = parsePrice(document.getElementById('p-tax-p-fixed').value);
    const t_f     = parsePrice(document.getElementById('p-tax-f').value);
    const a_c     = parsePrice(document.getElementById('p-costs').value);

    const taxAmount = (s_price * (t_p + t_f_p)) / 100;
    const totalCost = p_cost + taxAmount + t_f + a_c;
    const profit = s_price - totalCost;

    resCost.textContent = `R$ ${totalCost.toFixed(2)}`;
    resProfit.textContent = `R$ ${profit.toFixed(2)}`;
    resProfit.className = profit >= 0 ? 'profit-positive' : 'profit-negative';
}

// All marketplaces cached for filtering
let allMarketplaces = [];

async function populateCalcCatalogSelect() {
    if (!pCalcCatalogId) return;
    
    // 1. Products
    if (catalog.length === 0) await loadCatalog();
    pCalcCatalogId.innerHTML = '<option value="">-- Selecione para salvar na Gestão de Preços --</option>';
    catalog.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        pCalcCatalogId.appendChild(opt);
    });

    // Populate edit panel product select too
    const editProductSel = document.getElementById('edit-calc-product');
    if (editProductSel) {
        editProductSel.innerHTML = '<option value="">-- Selecione um Produto --</option>';
        catalog.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.name;
            editProductSel.appendChild(opt);
        });
    }

    // 2. Marketplaces
    if (!pCalcLabel) return;
    try {
        const res = await fetch(`${API_URL}/marketplaces`, {
            headers: { 'Authorization': localStorage.getItem('token') }
        });
        if (res.ok) {
            allMarketplaces = await res.json();
            // Default: show all stores (no product selected yet)
            filterStoresForCalc('');
        }
    } catch (err) { console.error('Erro ao buscar marketplaces para calculadora', err); }
}

// Filter the main calculator store dropdown based on selected product.
// Hides stores that already have a price registered for that product.
function filterStoresForCalc(productId) {
    if (!pCalcLabel) return;
    let usedLabels = [];
    if (productId) {
        const prod = catalog.find(p => String(p.id) === String(productId));
        if (prod && prod.prices) {
            usedLabels = prod.prices.map(pr => pr.label);
        }
    }
    // Build options excluding already-used labels
    const allStores = [{ name: 'Atacado' }, ...allMarketplaces];
    const available = allStores.filter(s => !usedLabels.includes(s.name));
    pCalcLabel.innerHTML = '<option value="">-- Selecionar Loja --</option>' +
        available.map(s => `<option value="${s.name}">${s.name}</option>`).join('');

    if (available.length === 0) {
        pCalcLabel.innerHTML = '<option value="">✅ Todas as lojas já foram cadastradas</option>';
    }
}

// When product changes in main calc → filter stores
if (pCalcCatalogId) {
    pCalcCatalogId.addEventListener('change', () => {
        filterStoresForCalc(pCalcCatalogId.value);
    });
}

// =====================
// EDIT CALC PANEL
// =====================
function updateEditPreview() {
    const p_cost  = parsePrice(document.getElementById('edit-p-cost')?.value);
    const s_price = parsePrice(document.getElementById('edit-p-price')?.value);
    const t_p     = parsePrice(document.getElementById('edit-p-tax-p')?.value);
    const t_f_p   = parsePrice(document.getElementById('edit-p-tax-p-fixed')?.value);
    const t_f     = parsePrice(document.getElementById('edit-p-tax-f')?.value);
    const a_c     = parsePrice(document.getElementById('edit-p-costs')?.value);

    const taxAmount = (s_price * (t_p + t_f_p)) / 100;
    const totalCost = p_cost + taxAmount + t_f + a_c;
    const profit = s_price - totalCost;

    const editResCost = document.getElementById('edit-res-cost');
    const editResProfit = document.getElementById('edit-res-profit');
    if (editResCost) editResCost.textContent = `R$ ${totalCost.toFixed(2)}`;
    if (editResProfit) {
        editResProfit.textContent = `R$ ${profit.toFixed(2)}`;
        editResProfit.className = profit >= 0 ? 'profit-positive' : 'profit-negative';
    }
}

// When edit panel product changes → populate stores that HAVE price registered
const editProductSel = document.getElementById('edit-calc-product');
const editStoreSel = document.getElementById('edit-calc-store');

if (editProductSel) {
    editProductSel.addEventListener('change', () => {
        const productId = editProductSel.value;
        const editFields = document.getElementById('edit-calc-fields');
        const editEmpty = document.getElementById('edit-calc-empty');

        if (!productId) {
            editStoreSel.innerHTML = '<option value="">-- Selecione o Produto primeiro --</option>';
            editStoreSel.disabled = true;
            editStoreSel.style.opacity = '0.6';
            if (editFields) editFields.style.display = 'none';
            if (editEmpty) editEmpty.style.display = 'block';
            return;
        }

        const prod = catalog.find(p => String(p.id) === String(productId));
        if (!prod || !prod.prices || prod.prices.length === 0) {
            editStoreSel.innerHTML = '<option value="">Nenhum preço cadastrado ainda</option>';
            editStoreSel.disabled = true;
            editStoreSel.style.opacity = '0.6';
            if (editFields) editFields.style.display = 'none';
            if (editEmpty) {
                editEmpty.style.display = 'block';
                editEmpty.querySelector('p').textContent = 'Este produto não tem preços cadastrados ainda.';
            }
            return;
        }

        // Populate stores with existing prices
        editStoreSel.innerHTML = '<option value="">-- Selecionar Loja --</option>' +
            prod.prices.map(pr => `<option value="${pr.label}">${pr.label}</option>`).join('');
        editStoreSel.disabled = false;
        editStoreSel.style.opacity = '1';
        if (editFields) editFields.style.display = 'none';
        if (editEmpty) {
            editEmpty.style.display = 'block';
            editEmpty.querySelector('p').textContent = 'Selecione uma loja para carregar os dados.';
        }
    });
}

// When edit panel store changes → load values
if (editStoreSel) {
    editStoreSel.addEventListener('change', () => {
        const productId = editProductSel?.value;
        const storeLabel = editStoreSel.value;
        const editFields = document.getElementById('edit-calc-fields');
        const editEmpty = document.getElementById('edit-calc-empty');

        if (!productId || !storeLabel) {
            if (editFields) editFields.style.display = 'none';
            if (editEmpty) editEmpty.style.display = 'block';
            return;
        }

        const prod = catalog.find(p => String(p.id) === String(productId));
        const priceEntry = prod?.prices?.find(pr => pr.label === storeLabel);

        if (!priceEntry) {
            if (editFields) editFields.style.display = 'none';
            if (editEmpty) editEmpty.style.display = 'block';
            return;
        }

        // Populate fields with stored values
        // We store cost=totalCost, value=salePrice, profit. We can't reverse-engineer individual tax fields
        // so we preset cost field only and leave tax fields at 0 for the user to re-enter if needed
        const editCost = document.getElementById('edit-p-cost');
        const editPrice = document.getElementById('edit-p-price');
        const editTaxP = document.getElementById('edit-p-tax-p');
        const editTaxPFixed = document.getElementById('edit-p-tax-p-fixed');
        const editTaxF = document.getElementById('edit-p-tax-f');
        const editCosts = document.getElementById('edit-p-costs');

        // Pre-fill: price (sale value), and cost as base product cost approximation
        if (editPrice) editPrice.value = Number(priceEntry.value || 0).toFixed(2);
        if (editCost) editCost.value = Number(prod.base_cost || 0).toFixed(2);
        if (editTaxP) editTaxP.value = 0;
        if (editTaxPFixed) editTaxPFixed.value = 0;
        if (editTaxF) editTaxF.value = 0;
        if (editCosts) editCosts.value = 0;

        if (editFields) editFields.style.display = 'block';
        if (editEmpty) editEmpty.style.display = 'none';
        updateEditPreview();
    });
}

// Edit panel live preview inputs
['edit-p-cost','edit-p-price','edit-p-tax-p','edit-p-tax-p-fixed','edit-p-tax-f','edit-p-costs'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateEditPreview);
});

// Edit panel save button
const editSaveBtn = document.getElementById('edit-calc-save-btn');
if (editSaveBtn) {
    editSaveBtn.addEventListener('click', async () => {
        const productId = editProductSel?.value;
        const storeLabel = editStoreSel?.value;

        if (!productId || !storeLabel) {
            alert('Selecione produto e loja antes de salvar.');
            return;
        }

        const p_cost  = parsePrice(document.getElementById('edit-p-cost')?.value);
        const s_price = parsePrice(document.getElementById('edit-p-price')?.value);
        const t_p     = parsePrice(document.getElementById('edit-p-tax-p')?.value);
        const t_f_p   = parsePrice(document.getElementById('edit-p-tax-p-fixed')?.value);
        const t_f     = parsePrice(document.getElementById('edit-p-tax-f')?.value);
        const a_c     = parsePrice(document.getElementById('edit-p-costs')?.value);

        if (s_price <= 0) { alert('Informe um preço de venda válido.'); return; }

        const taxAmount = (s_price * (t_p + t_f_p)) / 100;
        const totalCost = p_cost + taxAmount + t_f + a_c;
        const profit = s_price - totalCost;

        // Determine type from store label
        const isAtacado = storeLabel === 'Atacado';
        const type = isAtacado ? 'wholesale' : 'marketplace';

        const token = localStorage.getItem('token');
        try {
            editSaveBtn.disabled = true;
            editSaveBtn.textContent = 'Salvando...';
            const res = await fetch(`${API_URL}/catalog/${productId}/prices`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': token },
                body: JSON.stringify({ type, label: storeLabel, value: s_price, cost: totalCost, profit })
            });

            let data = {};
            try { data = await res.json(); } catch(e) {}

            if (!res.ok) throw new Error(data.message || 'Falha ao salvar.');

            alert(`✅ Cálculo de "${storeLabel}" atualizado com sucesso!`);
            await loadCatalog();
            // Refresh store select for this product after save
            const prod = catalog.find(p => String(p.id) === String(productId));
            if (prod && prod.prices) {
                editStoreSel.innerHTML = '<option value="">-- Selecionar Loja --</option>' +
                    prod.prices.map(pr => `<option value="${pr.label}">${pr.label}</option>`).join('');
                editStoreSel.value = storeLabel;
            }
        } catch (err) {
            alert('Erro: ' + err.message);
        } finally {
            editSaveBtn.disabled = false;
            editSaveBtn.innerHTML = '🔄 Atualizar Cálculo';
        }
    });
}


// Salvar / Adicionar Preço ao Catálogo via Calculadora (Fixed: Preço, Custo e Lucro)
calcForm.onsubmit = async (e) => {
    e.preventDefault();
    const catalogId = pCalcCatalogId.value;
    const type = document.getElementById('p-type').value;
    const label = pCalcLabel ? pCalcLabel.value : '';
    
    // Inputs
    const p_cost  = parsePrice(document.getElementById('p-cost').value);
    const s_price = parsePrice(document.getElementById('p-price').value);
    const t_p     = parsePrice(document.getElementById('p-tax-p').value);
    const t_f_p   = parsePrice(document.getElementById('p-tax-p-fixed').value);
    const t_f     = parsePrice(document.getElementById('p-tax-f').value);
    const a_c     = parsePrice(document.getElementById('p-costs').value);

    // Calculations
    const taxAmount = (s_price * (t_p + t_f_p)) / 100;
    const totalCost = p_cost + taxAmount + t_f + a_c;
    const profit = s_price - totalCost;

    if (!catalogId) {
        alert('Selecione um produto para salvar este preço na Gestão de Preços.');
        return;
    }

    if (s_price <= 0) {
        alert('Informe um preço de venda válido.');
        return;
    }

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/catalog/${catalogId}/prices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': token },
            body: JSON.stringify({ 
                type, 
                label, 
                value: s_price,
                cost: totalCost,
                profit: profit
            })
        });
        
        let data = { message: 'Erro desconhecido' };
        try { data = await res.json(); } catch(e) {}

        if (!res.ok) {
            console.error('API Error Response:', data);
            throw new Error(data.message || 'Falha ao salvar no servidor.');
        }

        alert('Cálculo salvo com sucesso na Gestão de Preços!');
        const savedProductId = catalogId;
        calcForm.reset();
        updatePreview();
        if (typeof loadCatalog === 'function') {
            await loadCatalog();
            // Re-filter stores for the previously selected product so saved store disappears
            filterStoresForCalc(savedProductId);
            pCalcCatalogId.value = savedProductId;
        }
    } catch (err) {
        console.error('Save Error:', err);
        alert('Erro: ' + err.message);
    }
};

window.deleteProduct = async (id) => {
    if (!confirm('Deseja excluir este registro?')) return;
    const token = localStorage.getItem('token');
    try {
        await fetch(`${API_URL}/products/${id}`, { method: 'DELETE', headers: { 'Authorization': token } });
        loadProducts();
    } catch (err) {
        console.error('Erro ao deletar produto', err);
    }
};

window.deletePrice = async (id) => {
    if (!confirm('Deseja excluir este preço e voltar o canal para o status anterior?')) return;
    const token = localStorage.getItem('token');
    try {
        await fetch(`${API_URL}/prices/${id}`, { method: 'DELETE', headers: { 'Authorization': token } });
        await loadCatalog();
        loadPricesView();
    } catch (err) {
        console.error('Erro ao deletar preço', err);
    }
};

async function loadPricesView() {
    if (catalog.length === 0) await loadCatalog();
    
    let html = '';
    
    catalog.forEach(p => {
        if (!p.prices || p.prices.length === 0) return;
        p.prices.forEach(pr => {
             const baseCost = Number(pr.cost || p.base_cost || 0);
             const profitValue = Number(pr.profit || 0);
             const profitClass = profitValue >= 0 ? 'var(--success)' : 'var(--danger)'; 
             html += `<tr>
                <td><strong>${p.name}</strong></td>
                <td><span class="badge" style="background: rgba(59, 130, 246, 0.2); color: #3b82f6;">${pr.label || 'Geral'}</span></td>
                <td>R$ ${baseCost.toFixed(2)}</td>
                <td style="color: var(--success); font-weight: bold;">R$ ${Number(pr.value).toFixed(2)}</td>
                <td style="color: ${profitClass};">R$ ${profitValue.toFixed(2)}</td>
                <td>
                    <button class="btn-delete" style="font-size: 0.8rem; color: #ef4444; border: none; background: none; cursor: pointer; padding: 5px 10px;" onclick="deletePrice(${pr.id})">🗑️ Remover</button>
                </td>
             </tr>`;
        });
    });
    
    if (html === '') {
        html = `<tr><td colspan="6" style="text-align:center; padding: 3rem; color: var(--text-muted); font-size: 1.1rem;">Nenhum preço salvo na Gestão de Preços ainda.<br><span style="font-size: 0.9rem; margin-top: 10px; display: inline-block;">Utilize a Calculadora de Lucro para precificar os produtos nos marketplaces.</span></td></tr>`;
    }
    
    if (pricesTableBody) pricesTableBody.innerHTML = html;
}

// =====================
// CATALOG
// =====================
btnAddCatalog.onclick = () => {
    editingCatalogId = null;
    openCatalogModal();
};
closeModal.onclick = () => catalogModal.classList.remove('active');

// Fecha modal ao clicar fora
catalogModal.onclick = (e) => {
    if (e.target === catalogModal) catalogModal.classList.remove('active');
};

function populateImportSelect() {
    catImportSelect.innerHTML = '<option value="">-- Escolha um cálculo para preencher --</option>';
    products.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.name}  |  Venda: R$ ${p.sale_price.toFixed(2)}  |  Custo: R$ ${p.cost.toFixed(2)}`;
        catImportSelect.appendChild(opt);
    });
}

// Price row logic removed as per user request (moved to Calculator)

function openCatalogModal(prefill = null) {
    catalogForm.reset();
    variationsMatrix.innerHTML = '';
    currentImageData = null;
    imagePreviewBox.style.backgroundImage = '';
    imagePreviewBox.innerHTML = '<span>Clique para enviar foto</span>';

    if (prefill) {
        document.getElementById('cat-name').value = prefill.name || '';
        document.getElementById('cat-cost').value = prefill.base_cost || 0;
        document.getElementById('cat-desc').value = prefill.description || '';
        
        if (prefill.image_data) {
            currentImageData = prefill.image_data;
            imagePreviewBox.style.backgroundImage = `url(${currentImageData})`;
            imagePreviewBox.innerHTML = '';
        }

        // Variations...
        if (prefill.variations && prefill.variations.length > 0) {
            const uniqueColors = [...new Set(prefill.variations.map(v => v.color))].join(', ');
            const uniqueSizes = [...new Set(prefill.variations.map(v => v.size))];
            
            document.getElementById('cat-colors').value = uniqueColors;
            
            // Mark checkboxes
            document.querySelectorAll('input[name="size"]').forEach(cb => {
                cb.checked = uniqueSizes.includes(cb.value);
            });

            // Render Matrix
            variationsMatrix.innerHTML = prefill.variations.map(v => `
                <div class="sku-row">
                    <span>${v.color}</span>
                    <span>${v.size}</span>
                    <input type="text" class="sku-input" data-color="${v.color}" data-size="${v.size}" value="${v.sku}">
                </div>
            `).join('');
        }
    }

    // Toggle sections visibility
    const varSection = document.getElementById('cat-variations-section');
    const modalTitle = document.querySelector('#catalog-modal h3');

    // Variations are now ALWAYS visible as per user's request
    if (varSection) varSection.style.display = 'block';

    if (editingCatalogId) {
        modalTitle.textContent = 'Editar Produto';
    } else {
        modalTitle.textContent = 'Cadastrar no Catálogo';
    }

    catalogModal.classList.add('active');
}

window.editCatalogProduct = (id) => {
    const prod = catalog.find(p => p.id === id);
    if (!prod) return;
    editingCatalogId = id;
    openCatalogModal(prod);
};

// Upload de imagem com corte central 1340x1785px
imageInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
            const targetW = 1340;
            const targetH = 1785;
            const targetRatio = targetW / targetH;
            const imgRatio = img.width / img.height;

            let sx = 0, sy = 0, sw = img.width, sh = img.height;

            if (imgRatio > targetRatio) {
                sw = img.height * targetRatio;
                sx = (img.width - sw) / 2;
            } else {
                sh = img.width / targetRatio;
                sy = (img.height - sh) / 2;
            }

            const canvas = document.createElement('canvas');
            canvas.width = targetW;
            canvas.height = targetH;
            canvas.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
            
            currentImageData = canvas.toDataURL('image/jpeg', 0.85); // 0.85 quality to balance size and looks
            imagePreviewBox.style.backgroundImage = `url(${currentImageData})`;
            imagePreviewBox.innerHTML = '';
        };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
};

// Gerar Matriz de SKUs
btnGenVariations.onclick = () => {
    const colors = document.getElementById('cat-colors').value.split(',').map(c => c.trim()).filter(Boolean);
    const sizes  = Array.from(document.querySelectorAll('input[name="size"]:checked')).map(s => s.value);
    const name   = document.getElementById('cat-name').value || 'PROD';

    if (!colors.length || !sizes.length) {
        alert('Defina pelo menos uma cor e um tamanho antes de gerar.');
        return;
    }

    variationsMatrix.innerHTML = '';
    colors.forEach(color => {
        sizes.forEach(size => {
            const sku = `${name.substring(0,3).toUpperCase()}-${color.substring(0,3).toUpperCase()}-${size}`;
            const row = document.createElement('div');
            row.className = 'sku-row';
            row.innerHTML = `
                <span>${color}</span>
                <span>${size}</span>
                <input type="text" class="sku-input" data-color="${color}" data-size="${size}" value="${sku}">
            `;
            variationsMatrix.appendChild(row);
        });
    });
};

// Salvar no Catálogo
catalogForm.onsubmit = async (e) => {
    e.preventDefault();

    const name       = document.getElementById('cat-name').value.trim();
    const base_cost  = Number(document.getElementById('cat-cost').value);

    if (!name) { alert('Informe o nome do produto.'); return; }

    const token = localStorage.getItem('token');
    
    // As variações agora são enviadas tanto no POST quanto no PUT para permitir adicionar/retirar
    const variations = Array.from(document.querySelectorAll('.sku-input')).map(input => ({
        color: input.dataset.color,
        size:  input.dataset.size,
        sku:   input.value
    }));

    const product = {
        name,
        description: document.getElementById('cat-desc').value,
        image_data:  currentImageData,
        base_cost,
        variations
    };

    const method = editingCatalogId ? 'PUT' : 'POST';
    const url = editingCatalogId ? `${API_URL}/catalog/${editingCatalogId}` : `${API_URL}/catalog`;

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': token },
            body: JSON.stringify(product)
        });

        // Tenta parsear como JSON; se falhar, é resposta HTML (ex: 413 payload too large)
        let data = null;
        try { data = await res.json(); } catch (_) {}

        if (res.ok) {
            catalogModal.classList.remove('active');
            editingCatalogId = null;
            switchSubView('catalog');
            await loadCatalog();
        } else if (res.status === 413) {
            alert('Imagem muito grande. Use uma imagem menor.');
        } else {
            alert('Erro ao salvar: ' + (data?.message || `Status ${res.status}`));
        }
    } catch (err) {
        console.error('Erro ao salvar no catálogo:', err);
        alert('Erro de rede ao salvar produto. Verifique se o servidor está rodando.');
    }
};

async function loadCatalog() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/catalog`, { headers: { 'Authorization': token } });
        if (res.ok) {
            catalog = await res.json();
            renderCatalog();
            typeof renderStock === 'function' && renderStock();
        }
    } catch (err) {
        console.error('Erro ao carregar catálogo', err);
    }
}

function renderCatalog() {
    if (!catalog.length) {
        catalogGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; color: var(--text-muted); padding: 4rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📦</div>
                <p>Nenhum produto no catálogo ainda.</p>
                <p style="font-size:0.85rem; margin-top:0.5rem;">Clique em "Novo Produto" para começar.</p>
            </div>`;
        return;
    }

    catalogGrid.innerHTML = catalog.map(p => `
        <div class="glass-card product-card">
            ${p.image_data
                ? `<img src="${p.image_data}" class="card-img" alt="${p.name}">`
                : `<div class="card-img" style="background:rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;">
                     <span style="font-size:2.5rem">📷</span>
                     <span style="color:var(--text-muted);font-size:0.8rem">Sem foto</span>
                   </div>`
            }
            <div class="card-content">
                <span class="card-category">Produto</span>
                <h3 class="card-title">${p.name}</h3>
                <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.5rem;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${p.description || 'Sem descrição'}</p>
                <div class="card-price-row" style="display:block;">
                    <div style="margin-bottom: 8px;">
                        ${p.prices && p.prices.length > 0 
                            ? p.prices.map(pr => `
                                <div class="price-tag-wrapper" style="margin-bottom: 5px;">
                                    <span class="price-tag ${pr.type}" title="${pr.type === 'marketplace' ? 'Marketplace' : 'Atacado'}">
                                        <b>${pr.label}:</b> R$ ${pr.value.toFixed(2)}
                                    </span>
                                    ${pr.profit ? `<span style="font-size:0.75rem; color:var(--success); margin-left:8px; font-weight:600;">(Lucro: R$ ${pr.profit.toFixed(2)})</span>` : ''}
                                </div>
                            `).join('') 
                            : '<span style="color:var(--danger); font-size:0.8rem;">Sem preços</span>'}
                    </div>
                    <div class="price-cost">Produção: R$ ${p.base_cost.toFixed(2)}</div>
                </div>
            </div>
            <div class="card-footer" style="padding: 1rem; border-top: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
                <div class="variation-badges" style="display: flex; gap: 4px; flex-wrap: wrap; flex-grow: 1;">
                    ${[...new Set(p.variations.map(v => v.size))].map(s => `<span class="badge" style="font-size: 0.75rem; padding: 2px 6px;">${s}</span>`).join('')}
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-text" style="font-size: 0.8rem; color: var(--primary);" onclick="editCatalogProduct(${p.id})">✏️ Editar</button>
                    <button class="btn-delete" style="font-size: 0.8rem; color: #ef4444; border: none; background: none; cursor: pointer;" onclick="deleteCatalogItem(${p.id})">Remover</button>
                </div>
            </div>
        </div>
    `).join('');
}

window.deleteCatalogItem = async (id) => {
    if (!confirm('Remover este produto do catálogo?')) return;
    const token = localStorage.getItem('token');
    try {
        await fetch(`${API_URL}/catalog/${id}`, { method: 'DELETE', headers: { 'Authorization': token } });
        loadCatalog();
    } catch (err) {
        console.error('Erro ao remover do catálogo', err);
    }
};

// =====================
// STOCK
// =====================
if (closeStockModal) closeStockModal.onclick = () => stockModal.classList.remove('active');

function renderStock() {
    if (!stockGrid) return;
    
    if (!catalog.length) {
        stockGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; color: var(--text-muted); padding: 4rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📦</div>
                <p>Nenhum produto cadastrado para gestão de estoque.</p>
                <p style="font-size:0.85; margin-top:0.5rem;">Cadastre no catálogo primeiro.</p>
            </div>`;
        return;
    }

    stockGrid.innerHTML = catalog.map(p => {
        const totalStock = p.variations.reduce((acc, v) => acc + (v.stock || 0), 0);
        return `
        <div class="glass-card product-card">
            ${p.image_data
                ? `<img src="${p.image_data}" class="card-img" alt="${p.name}">`
                : `<div class="card-img" style="background:rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;">
                     <span style="font-size:2.5rem">📷</span>
                   </div>`
            }
            <div class="card-content">
                <span class="card-category" style="color:var(--primary); font-weight: 600;">Estoque: ${totalStock} un</span>
                <h3 class="card-title">${p.name}</h3>
                <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.5rem;">${p.variations.length} Variações de SKUs</p>
            </div>
            <div class="card-footer">
                <button class="btn-primary" onclick="openStockModal(${p.id})">Editar Estoque</button>
            </div>
        </div>
    `}).join('');
}

window.openStockModal = (id) => {
    const prod = catalog.find(p => p.id === id);
    if (!prod) return;

    stockProductName.textContent = prod.name;
    stockForm.dataset.productId = id;

    if (!prod.variations || prod.variations.length === 0) {
        stockModalBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 2rem; color: var(--text-muted);">Nenhuma variação (Cor/Tamanho) cadastrada para este produto.</td></tr>`;
    } else {
        stockModalBody.innerHTML = prod.variations.map(v => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 10px 5px;">${v.color}</td>
                <td style="padding: 10px 5px;">${v.size}</td>
                <td style="padding: 10px 5px;"><small style="color:var(--text-muted)">${v.sku}</small></td>
                <td style="padding: 10px 5px;">
                    <input type="number" class="stock-input" data-var-id="${v.id}" value="${v.stock || 0}" min="0" style="width: 100%; padding: 8px; border-radius: 8px; background: rgba(15,23,42,0.5); border: 1px solid var(--border); color: white;">
                </td>
            </tr>
        `).join('');
    }

    stockModal.classList.add('active');
};

if (stockForm) {
    stockForm.onsubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        
        const inputs = document.querySelectorAll('.stock-input');
        const updates = Array.from(inputs).map(input => ({
            id: Number(input.dataset.varId),
            stock: Number(input.value) || 0
        }));

        if (updates.length === 0) {
            stockModal.classList.remove('active');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/stock`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': token },
                body: JSON.stringify(updates)
            });

            if (res.ok) {
                stockModal.classList.remove('active');
                await loadCatalog();
            } else {
                const data = await res.json();
                alert('Erro ao atualizar estoque: ' + (data.message || ''));
            }
        } catch (err) {
            console.error('Erro de rede:', err);
            alert('Erro ao conectar com o servidor para atualizar o estoque.');
        }
    };
}

// =====================
// CAMPAIGNS
// =====================
async function loadCampaigns() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/campaigns`, { headers: { 'Authorization': token } });
        if (res.ok) {
            campaigns = await res.json();
            renderCampaigns();
        }
    } catch (err) {
        console.error('Erro ao carregar campanhas', err);
    }
}

function renderCampaigns() {
    if (!campaignsGrid) return;
    
    if (!campaigns || !campaigns.length) {
        campaignsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; color: var(--text-muted); padding: 4rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🏷️</div>
                <p>Nenhuma campanha promocional criada.</p>
                <p style="font-size:0.85; margin-top:0.5rem;">Crie uma para organizar vendas com descontos e avaliar seu lucro líquido.</p>
            </div>`;
        return;
    }

    campaignsGrid.innerHTML = campaigns.map(c => {
        let textDiscount = [];
        if (c.discount_percent > 0) textDiscount.push(`${c.discount_percent}%`);
        if (c.discount_fixed > 0) textDiscount.push(`R$ ${c.discount_fixed.toFixed(2)}`);
        const badgeTxt = textDiscount.length ? `-${textDiscount.join(' / -')}` : 'Sem Desc.';

        let productsHtml = c.products && c.products.length ? c.products.map(p => {
            const salePrice = Number(p.sale_price) || 0;
            const cost = Number(p.base_cost) || 0;
            let promoPrice = salePrice;
            if (c.discount_percent > 0) promoPrice -= promoPrice * (c.discount_percent / 100);
            if (c.discount_fixed > 0) promoPrice -= c.discount_fixed;
            if (promoPrice < 0) promoPrice = 0;
            
            const profit = promoPrice - cost;
            const profitColor = profit > 0 ? '#10b981' : (profit < 0 ? '#ef4444' : '#f59e0b');

            return `
                <div style="display:flex; justify-content:space-between; align-items:center; padding: 6px 0; border-bottom: 1px dotted rgba(255,255,255,0.1); font-size: 0.85rem;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        ${p.image_data ? `<img src="${p.image_data}" style="width:24px; height:24px; object-fit:cover; border-radius:4px;">` : `<span style="font-size:1.2rem; line-height:1;">✨</span>`}
                        <span style="max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.name}</span>
                    </div>
                    <div style="text-align:right;">
                        <div style="text-decoration:line-through; color:var(--text-muted); font-size: 0.70rem;">R$ ${salePrice.toFixed(2)}</div>
                        <div style="color:white; font-weight:600; font-size: 0.90rem;">R$ ${promoPrice.toFixed(2)}</div>
                        <div style="color:${profitColor}; font-size:0.75rem; font-weight: 500; margin-top:2px;">Lucro: R$ ${profit.toFixed(2)}</div>
                    </div>
                </div>
            `;
        }).join('') : '';

        return `
        <div class="glass-card product-card" style="display: flex; flex-direction: column;">
            <div style="padding: 1.5rem; flex-grow: 1;">
                <div style="display:flex; justify-content:space-between; margin-bottom: 0.5rem; align-items: center;">
                    <h3 style="color:var(--primary); margin:0; font-size: 1.2rem;">${c.name}</h3>
                    <span class="badge" style="background: rgba(239,68,68,0.2); color: #ef4444; border: 1px solid #ef4444; margin:0;">${badgeTxt}</span>
                </div>
                ${c.marketplace_name ? `<div style="margin-bottom: 0.5rem;"><span class="badge" style="background: rgba(59, 130, 246, 0.2); color: #3b82f6; border: 1px solid #3b82f6;">🏪 ${c.marketplace_name}</span></div>` : ''}
                <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom: 1rem;">
                    Início: ${c.start_date ? new Date(c.start_date).toLocaleDateString() : 'Imediato'} <br>
                    Fim: ${c.end_date ? new Date(c.end_date).toLocaleDateString() : 'Indeterminado'}
                </p>
                <div style="background:rgba(0,0,0,0.3); padding: 10px; border-radius:8px; max-height: 250px; overflow-y:auto; margin-bottom:1rem; border: 1px solid rgba(255,255,255,0.05);">
                    <div style="font-size:0.8rem; text-transform:uppercase; color:var(--text-muted); margin-bottom:8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px;">
                        Produtos Participantes (${c.products ? c.products.length : 0})
                    </div>
                    ${productsHtml || '<div style="color:var(--text-muted); font-size:0.8rem; text-align:center; padding: 1rem 0;">Nenhum produto atrelado</div>'}
                </div>
            </div>
            <div class="card-footer" style="margin-top: auto; border-top: 1px solid rgba(255,255,255,0.1); padding: 1rem; display: flex; gap: 8px;">
                <button class="btn-text" style="color: var(--primary); flex: 1; text-align: center;" onclick="editCampaign(${c.id})">✏️ Editar</button>
                <button class="btn-text" style="color: #ef4444; flex: 1; text-align: center;" onclick="deleteCampaign(${c.id})">🗑️ Excluir</button>
            </div>
        </div>
    `}).join('');
}

function renderCampaignFormProducts(selectedIds = []) {
    const campProductsList = document.getElementById('camp-products-list');
    if (!catalog || !catalog.length) {
        campProductsList.innerHTML = '<div style="color:var(--text-muted); font-size:0.9rem; text-align: center; padding: 2rem;">Adicione produtos no Catálogo primeiro!</div>';
        return;
    }
    
    const mSelect = document.getElementById('camp-marketplace-id');
    const mktId = mSelect ? mSelect.value : '';

    campProductsList.innerHTML = catalog.map(p => {
        let salePrice = Number(p.sale_price) || 0;
        if (mktId && p.prices) {
            let mktName = null;
            if (typeof marketplaces !== 'undefined') {
                const m = marketplaces.find(mm => mm.id == mktId);
                if (m) mktName = m.name;
            }
            if (mktName) {
                const mktPriceObj = p.prices.find(pr => pr.type === 'marketplace' && pr.label === mktName);
                if (mktPriceObj && mktPriceObj.value !== null && mktPriceObj.value !== undefined && mktPriceObj.value !== '') {
                    salePrice = Number(mktPriceObj.value);
                }
            }
        }
        
        return `
        <label style="display:flex; align-items:center; gap: 12px; padding: 12px; border-radius: 8px; cursor:pointer; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); transition: background 0.2s ease, transform 0.1s ease; user-select: none;">
            <input type="checkbox" name="camp-prod" value="${p.id}" class="custom-checkbox" style="width: 18px; height: 18px; accent-color: var(--primary); cursor: pointer;" ${selectedIds.includes(p.id.toString()) ? 'checked' : ''}>
            ${p.image_data ? `<img src="${p.image_data}" style="width:40px; height:40px; object-fit:cover; border-radius:6px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">` : `<div style="width:40px; height:40px; border-radius:6px; background:rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center; font-size:1.2rem;">📷</div>`}
            <div style="display:flex; flex-direction:column; flex-grow: 1;">
                <span style="font-weight: 600; color: white;">${p.name}</span>
                <span style="font-size:0.75rem; color:var(--text-muted); margin-top: 2px;">Venda Mkt.: <strong style="color:var(--primary); font-weight:600;">R$ ${salePrice.toFixed(2)}</strong></span>
            </div>
        </label>
        `;
    }).join('');
}

window.deleteCampaign = async (id) => {
    if(!confirm('Excluir esta campanha de forma permanente?')) return;
    try {
        await fetch(`${API_URL}/campaigns/${id}`, { method:'DELETE', headers: { 'Authorization': localStorage.getItem('token') }});
        loadCampaigns();
    } catch(err) { console.error('Error', err); }
}

if (btnAddCampaign) {
    btnAddCampaign.onclick = () => {
        editingCampaignId = null;
        campaignForm.reset();
        document.querySelector('#campaign-modal h3').innerHTML = '<span>🎉</span> Criar Nova Campanha';
        
        const mSelect = document.getElementById('camp-marketplace-id');
        if (mSelect) {
            mSelect.innerHTML = '<option value="">-- Escolha o Canal / Loja (Opcional) --</option>' + (typeof marketplaces !== 'undefined' ? marketplaces : []).map(m => `<option value="${m.id}">${m.name}</option>`).join('');
            mSelect.value = '';
            mSelect.onchange = () => {
                const currentChecked = Array.from(document.querySelectorAll('input[name="camp-prod"]:checked')).map(cb => cb.value);
                renderCampaignFormProducts(currentChecked);
            };
        }
        
        // Render checkboxes based on Catalog
        renderCampaignFormProducts([]);
        
        campaignModal.classList.add('active');
    };
}

window.editCampaign = (id) => {
    const camp = campaigns.find(c => c.id === id);
    if (!camp) return;

    editingCampaignId = id;
    campaignForm.reset();
    document.querySelector('#campaign-modal h3').innerHTML = '<span>✏️</span> Editar Campanha';

    const mSelect = document.getElementById('camp-marketplace-id');
    const selectedIds = camp.products.map(p => p.product_id.toString());
    
    if (mSelect) {
        mSelect.innerHTML = '<option value="">-- Escolha o Canal / Loja (Opcional) --</option>' + (typeof marketplaces !== 'undefined' ? marketplaces : []).map(m => `<option value="${m.id}">${m.name}</option>`).join('');
        mSelect.value = camp.marketplace_id || '';
        mSelect.onchange = () => {
            const currentChecked = Array.from(document.querySelectorAll('input[name="camp-prod"]:checked')).map(cb => cb.value);
            renderCampaignFormProducts(currentChecked);
        };
    }

    document.getElementById('camp-name').value = camp.name;
    document.getElementById('camp-start').value = camp.start_date || '';
    document.getElementById('camp-end').value = camp.end_date || '';
    document.getElementById('camp-discount-percent').value = camp.discount_percent || '';
    document.getElementById('camp-discount-fixed').value = camp.discount_fixed || '';

    // Render checkboxes and check selected ones
    renderCampaignFormProducts(selectedIds);

    campaignModal.classList.add('active');
};
if (closeCampaignModal) closeCampaignModal.onclick = () => campaignModal.classList.remove('active');

if (campaignForm) {
    campaignForm.onsubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        
        const payload = {
            name: document.getElementById('camp-name').value,
            marketplace_id: document.getElementById('camp-marketplace-id') ? document.getElementById('camp-marketplace-id').value : '',
            start_date: document.getElementById('camp-start').value,
            end_date: document.getElementById('camp-end').value,
            discount_percent: document.getElementById('camp-discount-percent').value,
            discount_fixed: document.getElementById('camp-discount-fixed').value,
            selected_products: Array.from(document.querySelectorAll('input[name="camp-prod"]:checked')).map(cb => cb.value)
        };

        const method = editingCampaignId ? 'PUT' : 'POST';
        const url = editingCampaignId ? `${API_URL}/campaigns/${editingCampaignId}` : `${API_URL}/campaigns`;

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': token },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                campaignModal.classList.remove('active');
                editingCampaignId = null;
                await loadCampaigns();
            } else {
                const data = await res.json();
                alert('Erro: ' + (data.message || 'Falha ao salvar.'));
            }
        } catch (err) {
            console.error('Erro de rede', err);
            alert('Erro ao conectar com servidor.');
        }
    };
}

// =====================
// SALES
// =====================
async function loadSales() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/sales`, { headers: { 'Authorization': token } });
        if (res.ok) {
            salesData = await res.json();
            renderSales();
        }
    } catch (err) {
        console.error('Erro ao carregar vendas', err);
    }
}

function renderSales() {
    if (!salesGrid) return;
    if (!salesData || !salesData.length) {
        salesGrid.innerHTML = `
            <div style="text-align:center; color: var(--text-muted); padding: 4rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📈</div>
                <p>Nenhuma venda registrada até o momento.</p>
                <p style="font-size:0.85rem; margin-top:0.5rem;">Use o Caixa (PDV) para registrar vendas e baixar o estoque.</p>
            </div>`;
        return;
    }

    // Agrupa por data
    const grouped = salesData.reduce((acc, sale) => {
        const dateKey = sale.sale_date || 'Sem data';
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(sale);
        return acc;
    }, {});

    salesGrid.innerHTML = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a)).map(dateStr => {
        const daySales = grouped[dateStr];
        const totalItemsDay = daySales.reduce((sum, s) => sum + (s.quantity || 0), 0);
        const totalRevenueDay = daySales.reduce((sum, s) => sum + ((s.unit_price || 0) * (s.quantity || 0)), 0);
        const totalProfitDay  = daySales.reduce((sum, s) => sum + ((s.unit_profit || 0) * (s.quantity || 0)), 0);

        // Formata a data para exibição
        let dateDisplay = dateStr;
        try {
            const [y, m, d] = dateStr.split('-');
            if (y && m && d) dateDisplay = `${d}/${m}/${y}`;
        } catch(e) {}

        // Agrupa por produto dentro do dia
        const prodGroup = daySales.reduce((pAcc, s) => {
            if (!pAcc[s.name]) pAcc[s.name] = [];
            pAcc[s.name].push(s);
            return pAcc;
        }, {});

        const itemsHtml = Object.keys(prodGroup).map(pName => {
            const prodSales = prodGroup[pName];
            const prodTotal = prodSales.reduce((sum, s) => sum + (s.quantity || 0), 0);

            const vList = prodSales.map(v => {
                const unitPrice = v.unit_price ? `R$ ${Number(v.unit_price).toFixed(2)}` : '—';
                const unitProfit = v.unit_profit != null
                    ? `<span style="color:${v.unit_profit >= 0 ? '#10b981' : '#ef4444'}; font-weight:600;">Lucro: R$ ${Number(v.unit_profit).toFixed(2)}</span>`
                    : '';
                return `
                <div style="display:flex; justify-content:space-between; margin-top:6px; font-size:0.82rem; border-top:1px dotted rgba(255,255,255,0.07); padding-top:6px; align-items:center; flex-wrap:wrap; gap:4px;">
                    <div style="display:flex; flex-direction:column; gap:2px;">
                        <span>
                            <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:var(--primary); margin-right:6px;"></span>
                            ${v.color} | ${v.size} <small style="color:var(--text-muted)">(${v.sku})</small>
                        </span>
                        <span style="margin-left:13px; display:flex; gap:10px; flex-wrap:wrap;">
                            <span style="color:#ec4899; font-weight:600;">🏪 ${v.marketplace_name || 'Venda Direta'}</span>
                            <span style="color:var(--text-muted);">Preço: ${unitPrice}</span>
                            ${unitProfit}
                        </span>
                    </div>
                    <strong style="color:#10b981; font-size:0.95rem; white-space:nowrap;">+${v.quantity} un</strong>
                </div>`;
            }).join('');

            const thumb = prodSales[0].image_data;
            return `
            <div style="background:rgba(0,0,0,0.2); padding:14px; border-radius:10px; margin-bottom:10px; display:flex; gap:14px; border:1px solid rgba(255,255,255,0.04);">
                ${thumb
                    ? `<img src="${thumb}" style="width:48px; height:48px; object-fit:cover; border-radius:8px; flex-shrink:0;">`
                    : `<div style="width:48px; height:48px; border-radius:8px; background:rgba(255,255,255,0.07); display:flex; align-items:center; justify-content:center; font-size:1.4rem; flex-shrink:0;">📦</div>`
                }
                <div style="flex-grow:1; min-width:0;">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:4px; margin-bottom:4px;">
                        <strong style="color:var(--primary-light); font-size:1rem;">${pName}</strong>
                        <span class="badge" style="background:rgba(139,92,246,0.1); color:var(--primary-light); border-color:var(--primary); white-space:nowrap;">${prodTotal} un</span>
                    </div>
                    ${vList}
                </div>
            </div>`;
        }).join('');

        // Resumo financeiro do dia
        const hasFinancial = totalRevenueDay > 0;
        const financialSummary = hasFinancial ? `
            <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.07);">
                <div style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.2); border-radius:8px; padding:8px 14px; text-align:center; flex:1; min-width:100px;">
                    <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em;">Faturamento</div>
                    <div style="font-weight:700; color:#10b981; font-size:1rem;">R$ ${totalRevenueDay.toFixed(2)}</div>
                </div>
                <div style="background:rgba(${totalProfitDay>=0?'16,185,129':'239,68,68'},0.1); border:1px solid rgba(${totalProfitDay>=0?'16,185,129':'239,68,68'},0.2); border-radius:8px; padding:8px 14px; text-align:center; flex:1; min-width:100px;">
                    <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em;">Lucro do Dia</div>
                    <div style="font-weight:700; color:${totalProfitDay>=0?'#10b981':'#ef4444'}; font-size:1rem;">R$ ${totalProfitDay.toFixed(2)}</div>
                </div>
            </div>` : '';

        return `
        <details class="glass-card" style="padding:0; cursor:pointer; border:1px solid rgba(16,185,129,0.2); border-radius:16px; overflow:hidden;">
            <summary style="padding:1.25rem 1.5rem; display:flex; justify-content:space-between; align-items:center; list-style:none; user-select:none;">
                <div style="display:flex; align-items:center; gap:14px;">
                    <span style="font-size:1.6rem;">📅</span>
                    <div>
                        <div style="font-size:1.1rem; font-weight:700; color:white;">${dateDisplay}</div>
                        ${hasFinancial ? `<div style="font-size:0.75rem; color:#10b981;">R$ ${totalRevenueDay.toFixed(2)} faturado</div>` : ''}
                    </div>
                </div>
                <span class="badge" style="background:rgba(16,185,129,0.15); color:#10b981; border:1px solid #10b981; font-weight:700; font-size:0.95rem; white-space:nowrap;">${totalItemsDay} ${totalItemsDay === 1 ? 'item' : 'itens'}</span>
            </summary>
            <div style="padding:0 1.5rem 1.5rem; border-top:1px solid rgba(255,255,255,0.06);">
                <div style="margin-top:1rem;">
                    ${itemsHtml}
                    ${financialSummary}
                </div>
            </div>
        </details>`;
    }).join('');
}




// =====================
// LABELS & BARCODES
// =====================
async function loadLabels() {
    // Labels are built from catalog data
    if (!catalog.length) await loadCatalog();
    renderLabels();
}

window.setLabelPreset = (w, h) => {
    labelWidthMm.value = w;
    labelHeightMm.value = h;
    updateLabelDisplayPreview();
};

function renderLabels() {
    if (!labelsContainer) return;
    labelsListView.style.display = 'block';
    labelsDetailView.style.display = 'none';
    
    labelsContainer.innerHTML = catalog.map(p => `
        <div class="glass-card product-card" onclick="openProductLabels(${p.id})">
            ${p.image_data ? `<img src="${p.image_data}" class="card-img">` : `<div style="width:100%; aspect-ratio:4/5; background:rgba(255,255,255,0.05);"></div>`}
            <div class="card-content">
                <span class="card-category">${p.category}</span>
                <h3 class="card-title">${p.name}</h3>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem;">
                    <span class="badge" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid #f59e0b;">${p.variations.length} variações</span>
                    <button class="btn-text" style="color:#f59e0b;">Abrir ➡️</button>
                </div>
            </div>
        </div>
    `).join('');
}

window.openProductLabels = (productId) => {
    const product = catalog.find(p => p.id === productId);
    if (!product) return;

    detailProductName.innerText = product.name;
    labelsListView.style.display = 'none';
    labelsDetailView.style.display = 'block';

    const widthMm = labelWidthMm.value || 60;
    const heightMm = labelHeightMm.value || 40;

    labelsDetailGrid.innerHTML = product.variations.map((v, idx) => `
        <div class="glass-card" style="padding: 1rem; border-color: rgba(255,255,255,0.05);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
                <span style="font-weight:700; font-size: 0.9rem;">${v.color} | ${v.size}</span>
                <div style="display:flex; align-items:center; gap:8px;">
                    <label style="font-size:0.75rem;">Qtd:</label>
                    <input type="number" class="label-qty" data-sku="${v.sku}" data-name="${product.name}" data-color="${v.color}" data-size="${v.size}" data-price="${product.sale_price}" 
                           value="1" min="0" style="width:55px; padding:4px; background:rgba(0,0,0,0.3); color:white; border:1px solid rgba(255,255,255,0.1); border-radius:4px;">
                </div>
            </div>
            
            <!-- Live Preview of the Label -->
            <div class="label-preview-wrapper" style="display:flex; justify-content:center; background: #f0f0f0; padding: 10px; border-radius: 8px;">
                <div class="label-preview-card" style="width:${widthMm}mm; height:${heightMm}mm; background:white; color:black; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:5px; text-align:center; overflow:hidden;">
                    <div style="font-weight:bold; font-size: ${Math.max(6, heightMm/5)}pt; text-transform:uppercase;">ProfitCalc</div>
                    <div style="font-size: ${Math.max(5, heightMm/6)}pt;">${v.color} | ${v.size}</div>
                    <div style="flex-grow:1; display:flex; align-items:center; justify-content:center; width:100%; overflow:hidden;">
                        <svg class="preview-barcode" data-sku="${v.sku}" id="barcode-prev-${idx}"></svg>
                    </div>
                    <div style="font-weight:bold; font-size: ${Math.max(7, heightMm/4.5)}pt; text-transform:uppercase;">${product.name}</div>
                </div>
            </div>
        </div>
    `).join('');

    // Generate Barcodes
    product.variations.forEach((v, idx) => {
        try {
            JsBarcode(`#barcode-prev-${idx}`, v.sku, {
                format: "CODE128",
                width: 2, // Engrossar barras para 2px (muito melhor para celular)
                height: 40,
                displayValue: true,
                fontSize: 12,
                margin: 10, // Margem de segurança (Quiet Zone)
                background: "#ffffff", // Fundo branco sólido para contraste
                lineColor: "#000000"
            });
        } catch(e) { console.error(e); }
    });
};

window.closeProductLabels = () => {
    labelsListView.style.display = 'block';
    labelsDetailView.style.display = 'none';
};

window.updateLabelDisplayPreview = () => {
    const w = labelWidthMm.value || 60;
    const h = labelHeightMm.value || 40;
    
    document.querySelectorAll('.label-preview-card').forEach(card => {
        card.style.width = `${w}mm`;
        card.style.height = `${h}mm`;
        
        // Update font sizes
        card.children[0].style.fontSize = `${Math.max(6, h/5)}pt`;
        card.children[1].style.fontSize = `${Math.max(5, h/6)}pt`;
        card.children[3].style.fontSize = `${Math.max(7, h/4.5)}pt`;
    });

    // Re-render barcodes to handle width/height changes
    document.querySelectorAll('.preview-barcode').forEach(svg => {
        const sku = svg.dataset.sku;
        JsBarcode(svg, sku, {
            format: "CODE128",
            width: 2,
            height: 40,
            displayValue: true,
            fontSize: 10,
            margin: 10,
            background: "#ffffff",
            lineColor: "#000000"
        });
    });
};

window.printSelectedLabels = () => {
    const inputs = document.querySelectorAll('.label-qty');
    const widthMm = labelWidthMm.value || 60;
    const heightMm = labelHeightMm.value || 40;
    
    printStagingArea.innerHTML = '';
    
    let totalTags = 0;

    inputs.forEach(input => {
        const qty = parseInt(input.value);
        if (qty > 0) {
            const { sku, name, color, size, price } = input.dataset;
            for (let i = 0; i < qty; i++) {
                const label = document.createElement('div');
                label.className = `label-print-item`;
                label.style.width = `${widthMm}mm`;
                label.style.height = `${heightMm}mm`;
                
                label.innerHTML = `
                    <div class="label-info-top" style="font-size: ${Math.max(6, heightMm/5)}pt; margin-top:2px; font-weight:bold; text-transform:uppercase;">ProfitCalc</div>
                    <div class="label-variation" style="font-size: ${Math.max(5, heightMm/6)}pt;">${color} | ${size}</div>
                    <div class="barcode-container" style="flex-grow: 1; display: flex; align-items: center; justify-content: center; width: 100%; overflow: hidden; padding: 0 5px;">
                        <svg id="barcode-print-${totalTags}"></svg>
                    </div>
                    <div class="label-name-bottom" style="font-size: ${Math.max(7, heightMm/4.5)}pt; margin-bottom:2px; font-weight:bold; text-transform:uppercase;">${name}</div>
                `;
                printStagingArea.appendChild(label);
                
                JsBarcode(`#barcode-print-${totalTags}`, sku, {
                    format: "CODE128",
                    width: 1,
                    height: 22,
                    displayValue: true,
                    fontSize: 7,
                    margin: 1,
                    background: "#ffffff",
                    lineColor: "#000000"
                });
                totalTags++;
            }
        }
    });

    if (totalTags === 0) {
        alert("Defina a quantidade de pelo menos uma etiqueta para imprimir!");
        return;
    }

    // Show staging area for printing
    printStagingArea.style.display = 'grid';

    // Delaying print just long enough for the browser to acknowledge the DOM change
    setTimeout(() => {
        window.print();
        
        // Hide and clear after print dialog closes
        setTimeout(() => {
            printStagingArea.style.display = 'none';
            printStagingArea.innerHTML = '';
        }, 1000);
    }, 100);
};

// =====================
// POS (CAIXA)
// =====================
function initPOS() {
    posInput.focus();
    
    // Auto-focus logic: keep focus on input unless user is explicitly clicking something else
    // Skip if camera is active to prevent keyboard popping up on mobile
    document.onclick = (e) => {
        if (posView && posView.classList.contains('active') && !html5QrCode) {
             if(e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'A' && e.target.tagName !== 'SELECT') {
                posInput.focus();
             }
        }
    };

    posInput.onkeydown = async (e) => {
        if (e.key === 'Enter') {
            const sku = posInput.value.trim();
            if (!sku) return;
            
            posInput.value = '';
            processScan(sku, 'pos');
        }
    };
}

function initProduction() {
    prodInput.focus();
    
    document.onclick = (e) => {
        if (productionView && productionView.classList.contains('active') && !html5QrCode) {
             if(e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'A' && e.target.tagName !== 'SELECT') {
                prodInput.focus();
             }
        }
    };

    prodInput.onkeydown = async (e) => {
        if (e.key === 'Enter') {
            const sku = prodInput.value.trim();
            if (!sku) return;
            
            prodInput.value = '';
            processScan(sku, 'production');
        }
    };
}

window.toggleCameraScanner = async (mode = 'pos') => {
    const readerId = mode === 'production' ? "reader-prod" : "reader";
    const controlsId = mode === 'production' ? 'camera-controls-prod' : 'camera-controls';
    const laserId = mode === 'production' ? 'scanner-laser-prod' : 'scanner-laser';
    const btnId = mode === 'production' ? 'btn-toggle-camera-prod' : 'btn-toggle-camera';

    const readerWrapper = document.getElementById(controlsId);
    const laser = document.getElementById(laserId);
    const btn = document.getElementById(btnId);

    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode(readerId);
        readerWrapper.style.display = 'flex';
        laser.style.display = 'block';
        btn.innerText = "⏳ Iniciando Scanner...";
        
        try {
            const formats = [
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.CODE_39,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E
            ];
            
            const config = { 
                fps: 25, 
                qrbox: (vw, vh) => {
                    return { width: Math.min(vw * 0.9, 450), height: Math.min(vh * 0.25, 150) };
                },
                aspectRatio: 1.0,
                formatsToSupport: formats,
                experimentalFeatures: { useBarCodeDetectorIfSupported: true }
            };
            
            const videoConstraints = {
                facingMode: currentCameraFacing,
                width: { ideal: 1280 },
                height: { ideal: 720 }
            };

            await html5QrCode.start(videoConstraints, config, (decodedText) => {
                playSuccessBeep();
                processScan(decodedText, mode);
            });

            try {
                const track = html5QrCode.getRunningTrack();
                const caps = track.getCapabilities();
                const torchBtnId = mode === 'production' ? 'btn-torch-prod' : 'btn-torch';
                if (caps.torch) document.getElementById(torchBtnId).style.display = 'inline-block';
                if (caps.zoom) {
                    const zc = document.getElementById('zoom-control');
                    const zr = document.getElementById('zoom-range');
                    if (zc) {
                        zc.style.display = 'block';
                        zr.min = caps.zoom.min; zr.max = caps.zoom.max; zr.step = caps.zoom.step;
                        zr.oninput = async () => { await track.applyConstraints({ advanced: [{ zoom: zr.value }] }); };
                    }
                }
            } catch (e) {}
            btn.style.display = 'none';

        } catch (err) {
            console.warn("Falha no modo avançado, tentando modo simples...", err);
            try {
                if (html5QrCode) { try { await html5QrCode.stop(); } catch(e){} }
                html5QrCode = new Html5Qrcode(readerId);

                const simpleConfig = { 
                    fps: 20, 
                    qrbox: { width: 250, height: 120 },
                    formatsToSupport: [Html5QrcodeSupportedFormats.CODE_128, Html5QrcodeSupportedFormats.EAN_13]
                };
                
                await html5QrCode.start(
                    { facingMode: currentCameraFacing }, 
                    simpleConfig, 
                    (decodedText) => {
                        playSuccessBeep();
                        processScan(decodedText, mode);
                    }
                );
                btn.style.display = 'none';
            } catch (fallbackErr) {
                console.error("Falha total:", fallbackErr);
                alert("Erro ao acessar a câmera.");
                stopCameraScanner();
            }
        }
    } else {
        stopCameraScanner();
    }
};

window.stopCameraScanner = async () => {
    if (html5QrCode) {
        try { await html5QrCode.stop(); } catch (e) {}
        html5QrCode = null;
    }
    // Hide all possible scanner UIs
    ['camera-controls', 'camera-controls-prod'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = 'none';
    });
    ['scanner-laser', 'scanner-laser-prod'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = 'none';
    });
    
    if (document.getElementById('zoom-control')) document.getElementById('zoom-control').style.display = 'none';
    
    document.getElementById('btn-toggle-camera').style.display = 'inline-block';
    document.getElementById('btn-toggle-camera').innerText = "📸 Abrir Scanner Profissional";
    document.getElementById('btn-toggle-camera-prod').style.display = 'inline-block';
    document.getElementById('btn-toggle-camera-prod').innerText = "📸 Abrir Scanner de Produção";
};

function playSuccessBeep() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
}

window.switchCamera = async () => {
    currentCameraFacing = currentCameraFacing === "environment" ? "user" : "environment";
    if (html5QrCode) {
        await stopCameraScanner();
        await toggleCameraScanner();
    }
};


window.toggleTorch = async () => {
    if (html5QrCode) {
        try {
            const track = html5QrCode.getRunningTrack();
            const currentSettings = track.getSettings();
            await track.applyConstraints({
                advanced: [{ torch: !currentSettings.torch }]
            });
        } catch (err) { console.error("Erro ao alternar luz:", err); }
    }
};

async function processScan(sku, mode = 'pos') {
    // 1. Validar se a leitura parece "lixo"
    const isValidPattern = /^[A-Z0-9\-]+$/i.test(sku);
    
    if (!isValidPattern || sku.length < 3) {
        const feedbackEl = mode === 'production' ? prodFeedback : posFeedback;
        feedbackEl.innerHTML = `
            <div style="background: rgba(245,158,11,0.1); border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; display: inline-block;">
                <div style="color: #f59e0b; font-weight: bold; font-size: 1.1rem;">⚠️ Leitura Imprecisa</div>
                <div style="color: var(--text-muted); font-size: 0.85rem;">Enquadre melhor a etiqueta e evite trepidação.</div>
            </div>
        `;
        return;
    }

    const lightEl = mode === 'production' ? prodLight : posLight;
    lightEl.style.background = '#f59e0b';
    lightEl.style.boxShadow = '0 0 15px #f59e0b';

    if (mode === 'pos') {
        const mktId = posMarketplaceSelect.value;
        if (!mktId) {
            feedbackEl.innerHTML = `<div class="badge" style="background:rgba(239,68,68,0.2); color:#ef4444; padding:15px; width:100%; font-size:1rem; border:1px solid #ef4444;">⚠️ SELECIONE A LOJA/MARKETPLACE PRIMEIRO!</div>`;
            lightEl.style.background = '#ef4444';
            return;
        }
    }

    const token = localStorage.getItem('token');
    const endpoint = mode === 'production' ? '/production/scan' : '/sales/scan';
    
    try {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': token },
            body: JSON.stringify({ sku, marketplace_id: mode === 'pos' ? posMarketplaceSelect.value : null })
        });

        if (res.ok) {
            const data = await res.json();
            successScan(data.product, sku, mode);
        } else {
            const error = await res.json();
            failScan(error.message, sku, mode);
        }
    } catch (err) {
        failScan('Erro de conexão com o servidor', sku, mode);
    }
}

function successScan(prod, sku, mode = 'pos') {
    const lightEl = mode === 'production' ? prodLight : posLight;
    const feedbackEl = mode === 'production' ? prodFeedback : posFeedback;
    const history = mode === 'production' ? prodHistory : posHistory;

    lightEl.style.background = mode === 'production' ? '#8b5cf6' : '#10b981';
    lightEl.style.boxShadow = `0 0 20px ${mode === 'production' ? '#8b5cf6' : '#10b981'}`;
    
    let priceInfo = '';
    if (mode === 'pos' && prod.price) {
        priceInfo = `<div style="color: #10b981; font-weight: 800; font-size: 1.5rem; margin-top: 5px;">R$ ${prod.price}</div>
                     <div style="font-size: 0.75rem; opacity: 0.8;">Preço: ${prod.marketplace || 'Geral'}</div>`;
    }

    feedbackEl.innerHTML = `
        <div style="background: rgba(${mode === 'production' ? '139,92,246' : '16,185,129'}, 0.1); border: 1px solid ${mode === 'production' ? '#8b5cf6' : '#10b981'}; padding: 15px; border-radius: 8px; display: inline-block; animation: pulseSuccess 0.5s ease;">
            <div style="color: ${mode === 'production' ? '#8b5cf6' : '#10b981'}; font-weight: bold; font-size: 1.2rem;">✅ ${prod.name}</div>
            <div style="color: var(--text-muted); font-size: 0.9rem;">${prod.color} - ${prod.size} | Novo Estoque: ${prod.newStock}</div>
            ${priceInfo}
        </div>
    `;

    history.unshift({ 
        name: prod.name, 
        detail: `${prod.color} | ${prod.size} ${prod.price ? '| R$ '+prod.price : ''}`, 
        sku, 
        time: new Date().toLocaleTimeString(),
        status: 'success'
    });
    
    if (mode === 'production') renderProductionLog();
    else renderPOSLog();
}

function failScan(msg, sku, mode = 'pos') {
    const lightEl = mode === 'production' ? prodLight : posLight;
    const feedbackEl = mode === 'production' ? prodFeedback : posFeedback;
    const history = mode === 'production' ? prodHistory : posHistory;

    lightEl.style.background = '#ef4444';
    lightEl.style.boxShadow = '0 0 20px #ef4444';

    feedbackEl.innerHTML = `
        <div style="background: rgba(239,68,68,0.1); border: 1px solid #ef4444; padding: 15px; border-radius: 8px; display: inline-block; animation: shake 0.4s ease;">
            <div style="color: #ef4444; font-weight: bold; font-size: 1.2rem;">❌ Erro na leitura</div>
            <div style="color: var(--text-muted); font-size: 0.9rem;">${msg} (${sku})</div>
        </div>
    `;

    history.unshift({ 
        name: 'ERRO', 
        detail: msg, 
        sku, 
        time: new Date().toLocaleTimeString(),
        status: 'error'
    });
    
    if (mode === 'production') renderProductionLog();
    else renderPOSLog();
}

function renderProductionLog() {
    prodLog.innerHTML = prodHistory.slice(0, 5).map(h => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding: 12px; border-radius:8px; border-left: 4px solid ${h.status === 'success' ? '#8b5cf6' : '#ef4444'};">
            <div>
                <strong style="display:block; font-size: 0.9rem;">${h.name} <small style="color:var(--text-muted); margin-left:8px;">${h.sku}</small></strong>
                <span style="font-size:0.75rem; color:var(--text-muted);">${h.detail}</span>
            </div>
            <div style="font-size:0.7rem; color:var(--text-muted); font-weight:600;">${h.time}</div>
        </div>
    `).join('');
}

function renderPOSLog() {
    posLog.innerHTML = posHistory.slice(0, 5).map(h => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding: 12px; border-radius:8px; border-left: 4px solid ${h.status === 'success' ? '#10b981' : '#ef4444'};">
            <div>
                <strong style="display:block; font-size: 0.9rem;">${h.name} <small style="color:var(--text-muted); margin-left:8px;">${h.sku}</small></strong>
                <span style="font-size:0.75rem; color:var(--text-muted);">${h.detail}</span>
            </div>
            <div style="font-size:0.7rem; color:var(--text-muted); font-weight:600;">${h.time}</div>
        </div>
    `).join('');
}

async function loadProfitAnalysis() {
    const analysisTableBody = document.getElementById('analysis-table-body');
    const analysisSummary = document.getElementById('analysis-summary');
    if (!analysisTableBody) return;

    analysisTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem;">Carregando análise estratégica...</td></tr>';
    
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/analysis/profit`, {
            headers: { 'Authorization': token }
        });
        const data = await res.json();

        // Render Summary Cards
        const s = data.summary;
        analysisSummary.innerHTML = `
            <div class="glass-card" style="padding: 1rem 1.5rem; text-align: center; min-width: 140px; border-color: rgba(244,114,182,0.3);">
                <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Margem Geral</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: ${s.portfolioMargin < 20 ? 'var(--danger)' : 'var(--success)'}">${s.portfolioMargin}%</div>
            </div>
            <div class="glass-card" style="padding: 1rem 1.5rem; text-align: center; min-width: 140px; border-color: rgba(244,114,182,0.3);">
                <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Total Vendido</div>
                <div style="font-size: 1.5rem; font-weight: 700;">${s.totalUnits} <small style="font-size:0.8rem; color:var(--text-muted);">un</small></div>
            </div>
            <div class="glass-card" style="padding: 1rem 1.5rem; text-align: center; min-width: 180px; border-color: rgba(244,114,182,0.3);">
                <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Top Seller</div>
                <div style="font-size: 1rem; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 150px;">${s.topPerformer}</div>
            </div>
        `;

        // Render Table
        analysisTableBody.innerHTML = data.products.map((p, index) => `
            <tr>
                <td style="font-weight:700; color:var(--text-muted);">#${index + 1}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        ${p.image_data ? `<img src="${p.image_data}" style="width:35px; height:35px; border-radius:6px; object-fit:cover;">` : '<div style="width:35px; height:35px; border-radius:6px; background:rgba(255,255,255,0.05);"></div>'}
                        <span style="font-weight:600;">${p.name}</span>
                        ${p.is_campaign ? '<span class="badge" style="background:#f472b6; color:white; border:none; font-size:0.6rem;">CAMPANHA</span>' : ''}
                    </div>
                    <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
                        Preço: R$ ${p.current_effective_price.toFixed(2)}
                        &nbsp;|&nbsp;
                        <span style="color: rgba(239,68,68,0.8);">Custo Real: R$ ${(p.real_cost || p.base_cost).toFixed(2)}</span>
                    </div>
                </td>
                <td>
                    <span class="badge" style="padding: 4px 8px; border-radius: 6px; background: rgba(255,255,255,0.05); color: var(--text-muted); font-size: 0.75rem;">
                        ${p.status}
                    </span>
                </td>
                <td style="font-weight:600;">${p.total_sold}</td>
                <td style="color: ${p.profitReais >= 0 ? 'var(--success)' : 'var(--danger)'}; font-weight:600;">R$ ${p.profitReais.toFixed(2)}</td>
                <td style="font-weight:700; color: ${p.profitPercent < 15 ? 'var(--danger)' : p.profitPercent < 25 ? '#f59e0b' : 'var(--success)'}">${p.profitPercent.toFixed(1)}%</td>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span style="color: ${p.suggestionColor}; font-weight:700; font-size: 0.85rem;">${p.suggestion}</span>
                        ${p.suggestion.includes('Subir') ? '🚀' : p.suggestion.includes('Baixar') ? '📉' : '✅'}
                    </div>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="7" style="text-align:center; padding: 2rem;">Nenhuma venda registrada para análise ainda.</td></tr>';

        // Analysis breakdown by channel
        const channelMap = {};
        data.sales_raw?.forEach(s => {
            const mktName = s.marketplace_name || "Venda Direta / PDV";
            if (!channelMap[mktName]) channelMap[mktName] = { units: 0, revenue: 0, profit: 0 };
            
            channelMap[mktName].units += s.quantity;
            channelMap[mktName].revenue += s.sale_price * s.quantity;
            channelMap[mktName].profit += (s.sale_price - s.base_cost) * s.quantity;
        });
        renderChannelAnalysis(channelMap);

    } catch (err) {
        console.error("Erro ao carregar análise de lucro:", err);
        analysisTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem; color:var(--danger);">Falha ao conectar com o servidor para análise.</td></tr>';
    }
}

function renderChannelAnalysis(channelMap) {
    if (!channelAnalysisGrid) return;
    const channels = Object.keys(channelMap);
    
    if (channels.length === 0) {
        channelAnalysisGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding: 2rem; color: var(--text-muted); background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.1);">
                Aguardando primeiras vendas para gerar análise por canal...
            </div>`;
        return;
    }

    channelAnalysisGrid.innerHTML = channels.map(name => {
        const data = channelMap[name];
        const margin = data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0;
        return `
            <div class="glass-card" style="padding: 1.5rem; border-color: rgba(236, 72, 153, 0.2);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
                    <h4 style="color: #ec4899; margin:0;">${name}</h4>
                    <span class="badge" style="background: rgba(236, 72, 153, 0.1); color: #ec4899; border-color: #ec4899;">${data.units} itens</span>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <div style="font-size:0.75rem; color: var(--text-muted);">Faturamento</div>
                        <div style="font-weight:700; color: white;">R$ ${data.revenue.toFixed(2)}</div>
                    </div>
                    <div>
                        <div style="font-size:0.75rem; color: var(--text-muted);">Margem</div>
                        <div style="font-weight:700; color: #10b981;">${margin.toFixed(1)}%</div>
                    </div>
                    <div style="grid-column: 1/-1; margin-top: 5px; padding-top: 5px; border-top: 1px solid rgba(255,255,255,0.05);">
                        <div style="font-size:0.75rem; color: var(--text-muted);">Lucro Líquido</div>
                        <div style="font-weight:700; font-size: 1.1rem; color: #10b981;">R$ ${data.profit.toFixed(2)}</div>
                    </div>
                </div>
            </div>`;
    }).join('');
}

init();
// =====================
// MARKETPLACES
// =====================
async function loadMarketplaces() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/marketplaces`, { headers: { 'Authorization': token } });
        if (res.ok) {
            marketplaces = await res.json();
            renderMarketplaces();
            populatePOSMarketplaces();
        }
    } catch (err) {
        console.error('Erro ao carregar canais', err);
    }
}

function renderMarketplaces() {
    if (!marketplacesGrid) return;
    if (marketplaces.length === 0) {
        marketplacesGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; color: var(--text-muted); padding: 4rem; background: rgba(0,0,0,0.1); border-radius: 16px;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🌐</div>
                <p>Nenhum canal de venda cadastrado.</p>
                <p style="font-size:0.85rem;">Cadastre Shopee, Mercado Livre, Site ou sua Loja Física aqui.</p>
            </div>`;
        return;
    }

    marketplacesGrid.innerHTML = marketplaces.map(m => `
        <div class="glass-card" style="padding: 1.5rem; text-align: center; border-color: rgba(236, 72, 153, 0.2);">
            <div style="font-size: 2.5rem; margin-bottom: 1rem;">🏪</div>
            <h3 style="margin-bottom: 0.5rem; color: white;">${m.name}</h3>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1.5rem;">Cadastrado em: ${new Date(m.created_at).toLocaleDateString()}</p>
            <button onclick="deleteMarketplace(${m.id})" class="btn-text" style="color: #ef4444; font-size: 0.85rem;">Remover Canal</button>
        </div>
    `).join('');
}

function populatePOSMarketplaces() {
    if (!posMarketplaceSelect) return;
    const currentVal = posMarketplaceSelect.value;
    posMarketplaceSelect.innerHTML = `<option value="">-- Escolha o Marketplace --</option>` + 
        marketplaces.map(m => `<option value="${m.id}" ${currentVal == m.id ? 'selected' : ''}>${m.name}</option>`).join('');
}

if (marketplaceForm) {
    marketplaceForm.onsubmit = async (e) => {
        e.preventDefault();
        const mktNameInput = document.getElementById('mkt-name');
        const name = mktNameInput.value.trim();
        if (!name) return;

        try {
            const res = await fetch(`${API_URL}/marketplaces`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('token') },
                body: JSON.stringify({ name })
            });
            if (res.ok) {
                mktNameInput.value = '';
                loadMarketplaces();
            }
        } catch (err) {
            console.error(err);
        }
    };
}

window.deleteMarketplace = async (id) => {
    if (!confirm('Tem certeza que deseja remover este canal? As vendas já registradas manterão o registro, mas o canal não estará mais disponível para novas vendas.')) return;
    try {
        const res = await fetch(`${API_URL}/marketplaces/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': localStorage.getItem('token') }
        });
        if (res.ok) loadMarketplaces();
    } catch (err) {
        console.error(err);
    }
};

// =====================
// WHOLSEALE & CUSTOMERS LOGIC
// =====================

// Customers
window.loadCustomers = async () => {
    try {
        const res = await fetch(`${API_URL}/customers`, {
            headers: { 'Authorization': localStorage.getItem('token') }
        });
        customers = await res.json();
        renderCustomers();
        updateCustomerDropdown();
    } catch (err) { console.error(err); }
};

function renderCustomers() {
    if (!customersTableBody) return;
    customersTableBody.innerHTML = customers.map(c => `
        <tr>
            <td><strong>${c.name}</strong></td>
            <td>${c.phone || '-'}</td>
            <td>${c.email || '-'}</td>
            <td><small>${c.address || '-'}</small></td>
            <td>
                <button class="btn-text" onclick="deleteCustomer(${c.id})" style="color:#ef4444;">Excluir</button>
            </td>
        </tr>
    `).join('');
}

function updateCustomerDropdown() {
    // Tenta atualizar tanto o seletor antigo (se houver) quanto o novo do PDV
    if (typeof customerSelect !== 'undefined' && customerSelect) {
        customerSelect.innerHTML = '<option value="">Cliente Ocasional</option>' + 
            customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }
    
    const wcs = document.getElementById('wpos-customer-select');
    if (wcs) {
        wcs.innerHTML = '<option value="">Consumidor Final</option>' + 
            customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }
}

window.openCustomerModal = () => {
    document.getElementById('customer-modal').style.display = 'flex';
};

window.closeCustomerModal = () => {
    document.getElementById('customer-modal').style.display = 'none';
};

if (customerForm) {
    customerForm.onsubmit = async (e) => {
        e.preventDefault();
        const customer = {
            name: document.getElementById('cust-name').value,
            phone: document.getElementById('cust-phone').value,
            email: document.getElementById('cust-email').value,
            address: document.getElementById('cust-address').value
        };

        try {
            const res = await fetch(`${API_URL}/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('token') },
                body: JSON.stringify(customer)
            });
            if (res.ok) {
                customerForm.reset();
                closeCustomerModal();
                loadCustomers();
            }
        } catch (err) { console.error(err); }
    };
}

window.deleteCustomer = async (id) => {
    if (!confirm('Deseja remover este cliente?')) return;
    try {
        const res = await fetch(`${API_URL}/customers/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': localStorage.getItem('token') }
        });
        if (res.ok) loadCustomers();
    } catch (err) { console.error(err); }
};

// =====================================================================
// WHOLESALE POS — PDV DE ATACADO
// =====================================================================
let wposItems = [];
let wposScanTimer = null;
let wposFocusListenerAdded = false;

const wposBarcodeBox    = () => document.getElementById('wpos-barcode-input');
const wposCustomerSel   = () => document.getElementById('wpos-customer-select');
const wposCartBody      = () => document.getElementById('wpos-cart-body');
const wposTotalStr      = () => document.getElementById('wpos-total');
const wposFeedbackEl    = () => document.getElementById('wpos-feedback');
const wposStatusLightEl = () => document.getElementById('wpos-status-light');

window.loadWholesaleProducts = async () => {
    if (catalog.length === 0) await loadCatalog();
    if (customers.length === 0) await loadCustomers();

    // Preenche select de cliente
    const cs = wposCustomerSel();
    if (cs) {
        cs.innerHTML = '<option value="">Consumidor Final</option>' +
            customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }

    // Clona input para remover listeners antigos (evita duplicatas)
    const oldInput = wposBarcodeBox();
    if (oldInput) {
        const newInput = oldInput.cloneNode(true);
        oldInput.parentNode.replaceChild(newInput, oldInput);
        newInput.value = '';
        newInput.focus();

        // -------------------------------------------------------
        // DETECÇÃO INSTANTÂNEA DE SCANNER SEM ENTER
        // Timer de 120ms: processa quando parar de receber chars.
        // Scanner físico injeta todos os chars em < 50ms total.
        // Enter também é suportado se o scanner enviar.
        // -------------------------------------------------------
        newInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                clearTimeout(wposScanTimer);
                const val = newInput.value.trim();
                if (val.length >= 3) {
                    newInput.value = '';
                    processWposInput(val);
                    newInput.focus();
                }
            }
        });

        newInput.addEventListener('input', () => {
            clearTimeout(wposScanTimer);
            const val = newInput.value.trim();
            if (!val) return;
            wposScanTimer = setTimeout(() => {
                const captured = newInput.value.trim();
                if (captured.length >= 3) {
                    newInput.value = '';
                    processWposInput(captured);
                    setTimeout(() => { newInput.focus(); newInput.setSelectionRange(0, 0); }, 20);
                }
            }, 120);
        });

        // Listener único de reenfoque ao clicar fora
        if (!wposFocusListenerAdded) {
            wposFocusListenerAdded = true;
            document.addEventListener('click', (e) => {
                const view = document.getElementById('wholesale-pos-view');
                if (!view?.classList.contains('active')) return;
                if (!e.target.closest('button') && !e.target.closest('select') && !e.target.closest('input')) {
                    const inp = wposBarcodeBox();
                    if (inp) { inp.focus(); inp.setSelectionRange(0, 0); }
                }
            });
        }
    }

    // Botão Finalizar Venda
    const btnSubmit = document.getElementById('btn-submit-wpos');
    if (btnSubmit && !btnSubmit._wposHandlerAttached) {
        btnSubmit._wposHandlerAttached = true;
        btnSubmit.onclick = async () => {
            if (wposItems.length === 0) { alert('O carrinho está vazio!'); return; }
            const customerId = wposCustomerSel()?.value || null;
            const total = wposItems.reduce((s, i) => s + i.unit_price * i.quantity, 0);
            try {
                btnSubmit.disabled = true;
                btnSubmit.innerText = 'Processando...';
                const res = await fetch(`${API_URL}/wholesale/orders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('token') },
                    body: JSON.stringify({ customer_id: customerId, items: wposItems, total_amount: total })
                });
                if (res.ok) {
                    const saved = await res.json();
                    printWholesaleReceipt(saved.order, wposItems, customerId);
                    wposItems = [];
                    renderWposCart();
                    loadCatalog();
                    showWposFeedback('✅ Venda finalizada com sucesso!', 'success');
                } else {
                    const err = await res.json();
                    alert('Erro: ' + (err.message || 'Falha ao salvar'));
                }
            } catch (err) {
                console.error(err);
                alert('Erro de conexão!');
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerText = '✅ Finalizar Venda e Imprimir Cupom Não-Fiscal';
            }
        };
    }

    renderWposCart();
};

function processWposInput(query) {
    if (!query) return;
    const lowerQuery = query.toLowerCase().trim();

    let productFound = null;
    let variationFound = null;

    for (const p of catalog) {
        const v = p.variations?.find(v =>
            v.sku?.toLowerCase() === lowerQuery ||
            v.id?.toString() === lowerQuery
        );
        if (v) { productFound = p; variationFound = v; break; }
        // Fallback: nome do produto
        if (!variationFound && p.name?.toLowerCase() === lowerQuery && p.variations?.length > 0) {
            productFound = p; variationFound = p.variations[0]; break;
        }
    }

    if (!variationFound) {
        showWposFeedback(`❌ Produto não encontrado: <strong>${query}</strong>`, 'error');
        setWposLight('error');
        return;
    }

    // Busca preço atacado
    const wholesalePriceObj = productFound.prices?.find(pr =>
        pr.type === 'wholesale' ||
        pr.label?.toLowerCase().includes('atacad')
    );
    const unitPrice = wholesalePriceObj ? Number(wholesalePriceObj.value) : (productFound.base_cost || 0);
    const priceLabel = wholesalePriceObj?.label || 'Custo Base';

    const existing = wposItems.find(i => i.variation_id === variationFound.id);
    if (existing) {
        existing.quantity++;
        showWposFeedback(`✅ <strong>${productFound.name}</strong> (${variationFound.color} | ${variationFound.size}) → <span style="color:#10b981">× ${existing.quantity}</span>`, 'success');
    } else {
        wposItems.push({
            product_id: productFound.id,
            variation_id: variationFound.id,
            name: productFound.name,
            color: variationFound.color || '-',
            size: variationFound.size || '-',
            sku: variationFound.sku || '-',
            unit_price: unitPrice,
            price_label: priceLabel,
            quantity: 1
        });
        showWposFeedback(`✅ <strong>${productFound.name}</strong> (${variationFound.color} | ${variationFound.size}) adicionado — R$ ${unitPrice.toFixed(2)}`, 'success');
    }

    setWposLight('success');
    renderWposCart();
}

function setWposLight(status) {
    const light = wposStatusLightEl();
    if (!light) return;
    const colors = { success: '#10b981', error: '#ef4444', idle: '#fbbf24' };
    light.style.background = colors[status] || colors.idle;
    light.style.boxShadow = `0 0 20px ${colors[status] || colors.idle}`;
    setTimeout(() => {
        if (light) { light.style.background = colors.idle; light.style.boxShadow = `0 0 15px ${colors.idle}`; }
    }, 1500);
}

function showWposFeedback(msg, type) {
    const fb = wposFeedbackEl();
    if (!fb) return;
    const bg = type === 'error' ? '239,68,68' : '16,185,129';
    const border = type === 'error' ? '#ef4444' : '#10b981';
    fb.innerHTML = `<div style="padding:10px 15px;border-radius:10px;background:rgba(${bg},0.15);border:1px solid ${border};color:white;font-size:0.88rem;">${msg}</div>`;
    if (type !== 'error') setTimeout(() => { if (fb) fb.innerHTML = ''; }, 2500);
}

window.removeWposItem = (idx) => {
    wposItems.splice(idx, 1);
    renderWposCart();
    setTimeout(() => { const inp = wposBarcodeBox(); if (inp) { inp.focus(); inp.setSelectionRange(0,0); } }, 30);
};

window.changeWposQty = (idx, delta) => {
    if (!wposItems[idx]) return;
    wposItems[idx].quantity += delta;
    if (wposItems[idx].quantity <= 0) wposItems.splice(idx, 1);
    renderWposCart();
    setTimeout(() => { const inp = wposBarcodeBox(); if (inp) { inp.focus(); inp.setSelectionRange(0,0); } }, 30);
};

function renderWposCart() {
    const tbd = wposCartBody();
    if (!tbd) return;

    if (wposItems.length === 0) {
        tbd.innerHTML = `<tr><td colspan="7" style="padding:2.5rem;text-align:center;color:var(--text-muted);">
            <div style="font-size:2rem;margin-bottom:0.5rem;">🛒</div>
            Nenhum item. Bipe ou digite o SKU do produto para adicionar.
        </td></tr>`;
    } else {
        tbd.innerHTML = wposItems.map((it, idx) => `
        <tr style="border-bottom:1px solid rgba(255,255,255,0.07);">
            <td style="padding:10px 8px;">
                <div style="font-weight:700;font-size:0.9rem;">${it.name}</div>
                <div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px;">${it.sku}</div>
            </td>
            <td style="padding:10px 8px;text-align:center;">
                <span style="background:rgba(139,92,246,0.2);color:#a78bfa;border:1px solid rgba(139,92,246,0.4);border-radius:5px;padding:2px 8px;font-size:0.78rem;font-weight:600;">${it.color}</span>
            </td>
            <td style="padding:10px 8px;text-align:center;">
                <span style="background:rgba(59,130,246,0.2);color:#60a5fa;border:1px solid rgba(59,130,246,0.4);border-radius:5px;padding:2px 8px;font-size:0.82rem;font-weight:700;">${it.size}</span>
            </td>
            <td style="padding:10px 8px;text-align:center;">
                <div style="display:flex;align-items:center;justify-content:center;gap:4px;">
                    <button onclick="changeWposQty(${idx},-1)" style="width:24px;height:24px;border-radius:5px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.05);color:white;cursor:pointer;">−</button>
                    <span style="font-size:1rem;font-weight:700;min-width:24px;text-align:center;">${it.quantity}</span>
                    <button onclick="changeWposQty(${idx},+1)" style="width:24px;height:24px;border-radius:5px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.05);color:white;cursor:pointer;">+</button>
                </div>
            </td>
            <td style="padding:10px 8px;text-align:right;font-size:0.82rem;color:rgba(255,255,255,0.5);">R$ ${Number(it.unit_price).toFixed(2)}</td>
            <td style="padding:10px 8px;text-align:right;color:#10b981;font-weight:700;font-size:0.95rem;">R$ ${(Number(it.unit_price) * it.quantity).toFixed(2)}</td>
            <td style="padding:10px 8px;text-align:center;">
                <button onclick="removeWposItem(${idx})" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);color:#ef4444;border-radius:5px;padding:3px 9px;cursor:pointer;font-size:0.78rem;" onmouseover="this.style.background='rgba(239,68,68,0.25)'" onmouseleave="this.style.background='rgba(239,68,68,0.1)'">✕</button>
            </td>
        </tr>`).join('');
    }

    const total = wposItems.reduce((acc, it) => acc + (Number(it.unit_price) * it.quantity), 0);
    const ts = wposTotalStr();
    if (ts) ts.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

function printWholesaleReceipt(orderData, itemsUsed, customerIdSelected) {
    let parea = document.getElementById('wholesale-print-staging');
    if (!parea) {
        parea = document.createElement('div');
        parea.id = 'wholesale-print-staging';
        parea.className = 'print-only';
        document.body.appendChild(parea);
    }

    let customerName = 'Consumidor Final';
    if (customerIdSelected) {
        const c = customers.find(c => c.id == parseInt(customerIdSelected));
        if (c) customerName = c.name;
    }

    const orderNo = orderData?.id || '---';
    const total = orderData?.total_amount ?? itemsUsed.reduce((s, i) => s + Number(i.unit_price) * i.quantity, 0);

    const rows = itemsUsed.map(i => `
        <tr>
            <td style="padding:4px 2px;border-bottom:1px dashed #ccc;">${i.name}<br><span style="font-size:9px;color:#555;">${i.color} | ${i.size} — SKU: ${i.sku}</span></td>
            <td style="padding:4px 2px;border-bottom:1px dashed #ccc;text-align:center;">${i.quantity}</td>
            <td style="padding:4px 2px;border-bottom:1px dashed #ccc;text-align:right;">R$ ${Number(i.unit_price).toFixed(2)}</td>
            <td style="padding:4px 2px;border-bottom:1px dashed #ccc;text-align:right;font-weight:bold;">R$ ${(Number(i.unit_price) * i.quantity).toFixed(2)}</td>
        </tr>`).join('');

    parea.innerHTML = `
        <div style="width:100%;max-width:320px;margin:0 auto;font-family:'Courier New',monospace;font-size:11px;color:#000;">
            <div style="text-align:center;border-bottom:2px dashed #000;padding-bottom:10px;margin-bottom:10px;">
                <strong style="font-size:15px;display:block;margin-bottom:3px;">PROFITCALC ERP</strong>
                <span style="font-size:10px;">CUPOM NÃO FISCAL — VENDA ATACADO</span><br>
                <span>Nº ${String(orderNo).padStart(6,'0')} — ${new Date().toLocaleString('pt-BR')}</span>
            </div>
            <div style="margin-bottom:10px;border-bottom:1px dashed #000;padding-bottom:8px;">
                <strong>Cliente:</strong> ${customerName}
            </div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:10px;">
                <thead>
                    <tr>
                        <th style="border-bottom:1px solid #000;padding-bottom:3px;font-size:10px;">Descrição</th>
                        <th style="border-bottom:1px solid #000;padding-bottom:3px;text-align:center;font-size:10px;">Qtd</th>
                        <th style="border-bottom:1px solid #000;padding-bottom:3px;text-align:right;font-size:10px;">Unit.</th>
                        <th style="border-bottom:1px solid #000;padding-bottom:3px;text-align:right;font-size:10px;">Total</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
            <div style="text-align:right;border-top:2px solid #000;padding-top:6px;font-weight:bold;font-size:14px;">
                TOTAL: R$ ${Number(total).toFixed(2)}
            </div>
            <div style="text-align:center;margin-top:18px;font-size:10px;border-top:1px dashed #000;padding-top:10px;">
                Obrigado pela preferência!<br>Documento sem valor fiscal.
            </div>
        </div>`;

    setTimeout(() => { window.print(); parea.innerHTML = ''; }, 300);
}

function processWposInput(query) {
    const lowerQuery = query.toLowerCase();
    let productFound = null;
    let variationFound = null;

    for (const p of catalog) {
        const matchedVar = p.variations?.find(v => v.sku?.toLowerCase() === lowerQuery || v.id.toString() === lowerQuery);
        if (matchedVar) { productFound = p; variationFound = matchedVar; break; }
    }

    if (!variationFound) return;

    const wholesalePrice = productFound.prices?.find(pr => pr.type === 'wholesale' || pr.label?.toLowerCase().includes('atacado'))?.value || productFound.base_cost || 0;

    const existing = wposItems.find(i => i.variation_id === variationFound.id);
    if (existing) {
        existing.quantity++;
    } else {
        wposItems.push({
            product_id: productFound.id,
            variation_id: variationFound.id,
            name: productFound.name,
            color: variationFound.color || '-',
            size: variationFound.size || '-',
            unit_price: wholesalePrice,
            quantity: 1
        });
    }
    renderWposCart();
}

window.removeWposItem = (idx) => { wposItems.splice(idx, 1); renderWposCart(); };

function renderWposCart() {
    const tbd = wposCartBody();
    if (!tbd) return;
    tbd.innerHTML = wposItems.map((it, idx) => `
        <tr>
            <td>${it.name} (${it.color}/${it.size})</td>
            <td>${it.quantity}</td>
            <td>R$ ${it.unit_price.toFixed(2)}</td>
            <td>R$ ${(it.unit_price * it.quantity).toFixed(2)}</td>
            <td><button onclick="removeWposItem(${idx})">✕</button></td>
        </tr>`).join('');
    const total = wposItems.reduce((acc, it) => acc + (it.unit_price * it.quantity), 0);
    if (wposTotalStr()) wposTotalStr().textContent = `R$ ${total.toFixed(2)}`;
}

function printWholesaleReceipt(orderData, itemsUsed, customerIdSelected) {
    let customerName = 'Consumidor Final';
    if (customerIdSelected) {
        const c = customers.find(c => c.id == parseInt(customerIdSelected));
        if (c) customerName = c.name;
    }

    const orderNo  = orderData?.id || '---';
    const total    = orderData?.total_amount ?? itemsUsed.reduce((s, i) => s + Number(i.unit_price) * i.quantity, 0);
    const dataHora = new Date().toLocaleString('pt-BR');

    const rows = itemsUsed.map(i =>
        '<tr>' +
        '<td style="padding:2px 0;border-bottom:1px dashed #aaa;word-break:break-word;">' +
            i.name + '<br>' +
            '<span style="font-size:8pt;color:#444;">' + (i.color||'-') + ' | ' + (i.size||'-') + ' &mdash; SKU:' + (i.sku||'-') + '</span>' +
        '</td>' +
        '<td style="padding:2px 0;border-bottom:1px dashed #aaa;text-align:center;">' + i.quantity + '</td>' +
        '<td style="padding:2px 0;border-bottom:1px dashed #aaa;text-align:right;">R$' + Number(i.unit_price).toFixed(2) + '</td>' +
        '<td style="padding:2px 0;border-bottom:1px dashed #aaa;text-align:right;font-weight:bold;">R$' + (Number(i.unit_price) * i.quantity).toFixed(2) + '</td>' +
        '</tr>'
    ).join('');

    // Garante que o elemento existe
    let parea = document.getElementById('wholesale-print-staging');
    if (!parea) {
        parea = document.createElement('div');
        parea.id = 'wholesale-print-staging';
        document.body.appendChild(parea);
    }

    parea.innerHTML =
        '<div style="text-align:center;border-bottom:2px dashed #000;padding-bottom:6px;margin-bottom:6px;">' +
            '<b style="font-size:14pt;display:block;">PROFITCALC ERP</b>' +
            '<span style="font-size:8pt;">CUPOM NAO FISCAL &mdash; ATACADO</span><br>' +
            '<span style="font-size:9pt;">N: ' + String(orderNo).padStart(6,'0') + ' &mdash; ' + dataHora + '</span>' +
        '</div>' +
        '<div style="border-bottom:1px dashed #000;padding-bottom:4px;margin-bottom:4px;">' +
            '<b>Cliente:</b> ' + customerName +
        '</div>' +
        '<table style="width:100%;border-collapse:collapse;font-size:9pt;margin-bottom:6px;">' +
            '<thead><tr>' +
                '<th style="text-align:left;border-bottom:1px solid #000;padding:2px 0;">Produto</th>' +
                '<th style="text-align:center;border-bottom:1px solid #000;padding:2px 0;">Qtd</th>' +
                '<th style="text-align:right;border-bottom:1px solid #000;padding:2px 0;">Unit</th>' +
                '<th style="text-align:right;border-bottom:1px solid #000;padding:2px 0;">Total</th>' +
            '</tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
        '</table>' +
        '<div style="text-align:right;border-top:2px solid #000;padding-top:4px;font-size:13pt;font-weight:bold;">' +
            'TOTAL: R$ ' + Number(total).toFixed(2) +
        '</div>' +
        '<div style="text-align:center;margin-top:12px;font-size:8pt;border-top:1px dashed #000;padding-top:6px;">' +
            'Obrigado pela preferencia!<br>Documento sem valor fiscal.' +
        '</div>';

    // Exibe o div (necessário para o browser renderizar antes do print)
    parea.style.display = 'block';

    // Pequeno delay para garantir renderização, depois imprime
    setTimeout(function() {
        window.print();
        // Esconde novamente após impressão
        setTimeout(function() {
            parea.style.display = 'none';
        }, 500);
    }, 250);
}


// Orders Management
window.loadWholesaleOrders = async () => {
    try {
        const res = await fetch(`${API_URL}/wholesale/orders`, {
            headers: { 'Authorization': localStorage.getItem('token') }
        });
        const orders = await res.json();
        renderWholesaleOrders(orders);
    } catch (err) { console.error(err); }
};

function renderWholesaleOrders(orders) {
    if (!wholesaleOrdersTable) return;
    wholesaleOrdersTable.innerHTML = orders.map(o => `
        <tr>
            <td><small>${new Date(o.created_at).toLocaleString('pt-BR')}</small></td>
            <td><strong>${o.customer_name || 'Individual'}</strong></td>
            <td>R$ ${o.total_amount.toFixed(2)}</td>
            <td><span class="order-badge badge-pending">Pendente</span></td>
            <td style="display: flex; gap: 8px;">
                <button class="btn-text" onclick="printWholesaleCoupon(${o.id})" style="color:var(--primary-light);">🖨️ Cupom</button>
                <button class="btn-text" onclick="deleteWholesaleOrder(${o.id})" style="color:#ef4444;">&times;</button>
            </td>
        </tr>
    `).join('');
}

window.deleteWholesaleOrder = async (id) => {
    if (!confirm('Deseja cancelar/remover este pedido?')) return;
    try {
        const res = await fetch(`${API_URL}/wholesale/orders/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': localStorage.getItem('token') }
        });
        if (res.ok) loadWholesaleOrders();
    } catch (err) { console.error(err); }
};

window.printWholesaleCoupon = async (orderId) => {
    // Fetch fresh order details or find in list
    const res = await fetch(`${API_URL}/wholesale/orders`, {
        headers: { 'Authorization': localStorage.getItem('token') }
    });
    const orders = await res.json();
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const staging = document.getElementById('wholesale-print-staging');
    staging.innerHTML = `
        <div class="print-header">
            <h3>PROFITCALC ERP</h3>
            <p>RESUMO DE PEDIDO - ATACADO</p>
            <p>${new Date(order.created_at).toLocaleString('pt-BR')}</p>
        </div>
        <div style="margin-bottom: 10px;">
            <strong>CLIENTE:</strong> ${order.customer_name || 'Individual'}<br>
            <strong>WHATSAPP:</strong> ${order.customer_phone || '-'}<br>
            <strong>ID PEDIDO:</strong> #${order.id}
        </div>
        <table class="print-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th style="text-align:right;">Qtd</th>
                    <th style="text-align:right;">Total</th>
                </tr>
            </thead>
            <tbody>
                ${order.items.map(item => `
                    <tr>
                        <td style="font-size: 8pt;">${item.product_name}<br>(${item.color} | ${item.size})</td>
                        <td style="text-align:right; vertical-align:top;">${item.quantity}</td>
                        <td style="text-align:right; vertical-align:top;">R$ ${(item.unit_price * item.quantity).toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <div class="print-footer">
            <h3 style="margin: 0;">TOTAL: R$ ${order.total_amount.toFixed(2)}</h3>
        </div>
        <div style="text-align:center; margin-top: 15px; font-size: 8pt; border-top: 1px dashed #000; padding-top: 5px;">
            Obrigado pela preferência!
        </div>
    `;

    staging.style.display = 'block';
    window.print();
    setTimeout(() => { staging.style.display = 'none'; }, 500);
};

// --- New Core Functions ---

window.loadMarketplaces = async () => {
    if (!posMarketplaceSelect) return;
    try {
        const res = await fetch(`${API_URL}/marketplaces`, {
            headers: { 'Authorization': localStorage.getItem('token') }
        });
        if (res.ok) {
            marketplaces = await res.json();
            // Update POS dropdown
            const currentVal = posMarketplaceSelect.value;
            posMarketplaceSelect.innerHTML = '<option value="">-- Escolha o Marketplace --</option>' + 
                marketplaces.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
            if (currentVal) posMarketplaceSelect.value = currentVal;
            
            // Also update marketplaces management grid if it exists
            if (typeof renderMarketplaces === 'function') renderMarketplaces();
        }
    } catch (err) { console.error('Erro ao carregar marketplaces:', err); }
};




window.updatePricePoint = async (productId, priceId, newValue) => {
    try {
        const res = await fetch(`${API_URL}/catalog/${productId}/prices-update`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('token') },
            body: JSON.stringify({ priceId, newValue: parseFloat(newValue) })
        });
        if (res.ok) {
            showFeedback('Preço atualizado com sucesso!');
            loadCatalog(); // Refresh in background
        } else {
            const err = await res.json();
            alert('Erro: ' + err.message);
        }
    } catch (err) {
        console.error('Update price error:', err);
    }
};
