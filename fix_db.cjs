const fs = require('fs');

let code = fs.readFileSync('server/db.ts', 'utf8');

const oldMigration = `    if (table === 'assets') {
      if (columns.find(c => c.name === 'asset_tag')) {
        db.prepare("DROP TABLE assets").run();
        db.prepare(\`
          CREATE TABLE assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            asset_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            status TEXT DEFAULT 'Active',
            assigned_to TEXT,
            department TEXT,
            purchase_date DATE,
            condition TEXT DEFAULT 'Good',
            notes TEXT,
            device_code TEXT,
            brand TEXT,
            specs TEXT,
            serial_number TEXT,
            usage_status TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        \`).run();
      }`;

const newMigration = `    if (table === 'assets') {
      if (columns.find(c => c.name === 'asset_tag')) {
        try {
          db.prepare("ALTER TABLE assets RENAME COLUMN asset_tag TO asset_id").run();
        } catch (e) {
          console.error("Migration rename error:", e);
        }
      }`;

code = code.replace(oldMigration, newMigration);

fs.writeFileSync('server/db.ts', code);
