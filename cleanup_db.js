const Database = require('better-sqlite3');
const db = new Database('database.db');

console.log('--- Database Hard Reset Iniciado ---');

try {
    const transaction = db.transaction(() => {
        // Clear all business/catalog data
        // Order matters if foreign keys are enabled (though they often aren't by default in SQLite unless PRAGMA is used)
        
        console.log('Limpando vendas e produção...');
        db.prepare('DELETE FROM sales').run();
        db.prepare('DELETE FROM production_entries').run();
        
        console.log('Limpando campanhas...');
        db.prepare('DELETE FROM campaign_products').run();
        db.prepare('DELETE FROM campaigns').run();
        
        console.log('Limpando variações e preços...');
        db.prepare('DELETE FROM variations').run();
        db.prepare('DELETE FROM product_prices').run();
        
        console.log('Limpando catálogo e produtos legados...');
        db.prepare('DELETE FROM catalog_products').run();
        db.prepare('DELETE FROM products').run();
        
        console.log('Limpando marketplaces extras...');
        db.prepare('DELETE FROM marketplaces').run();
    });

    transaction();
    console.log('--- Database Reset Completo! ---');
    console.log('Logins (Ame Modas / Shine Modas) preservados.');
} catch (err) {
    console.error('Erro durante o reset:', err);
} finally {
    db.close();
}
