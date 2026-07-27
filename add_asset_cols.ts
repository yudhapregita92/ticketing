import db from './server/db.ts';

const migrate = () => {
  const newCols = [
    { name: 'device_code', type: 'TEXT' },
    { name: 'brand', type: 'TEXT' },
    { name: 'specs', type: 'TEXT' },
    { name: 'serial_number', type: 'TEXT' },
    { name: 'usage_status', type: 'TEXT' }
  ];

  for (const col of newCols) {
    try {
      db.prepare(`ALTER TABLE assets ADD COLUMN ${col.name} ${col.type}`).run();
      console.log(`Migration: Added ${col.name} column to assets table.`);
    } catch (err) {
      // Column might exist
    }
  }

  db.prepare(`
    CREATE TABLE IF NOT EXISTS asset_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  const count = db.prepare("SELECT COUNT(*) as count FROM asset_categories").get() as any;
  if (count.count === 0) {
    const insert = db.prepare("INSERT INTO asset_categories (name) VALUES (?)");
    ['Laptop', 'PC Desktop', 'Printer', 'Monitor', 'Jaringan'].forEach(name => insert.run(name));
  }
};

migrate();
