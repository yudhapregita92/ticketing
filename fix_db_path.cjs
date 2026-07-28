const fs = require('fs');

let code = fs.readFileSync('server/db.ts', 'utf8');

const oldInit = `import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

const db = new Database("tickets.db", { timeout: 15000 });`;

const newInit = `import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";

let dbPath = "tickets.db";

// Jika berjalan di Windows, gunakan C:\\ticketing-data
if (process.platform === 'win32') {
  const winDbDir = "C:\\\\ticketing-data";
  if (!fs.existsSync(winDbDir)) {
    try {
      fs.mkdirSync(winDbDir, { recursive: true });
    } catch (e) {
      console.warn("Gagal membuat direktori C:\\\\ticketing-data, menggunakan tickets.db lokal.", e);
    }
  }
  if (fs.existsSync(winDbDir)) {
    dbPath = path.join(winDbDir, "tickets.db");
  }
}

console.log(\`[DB] Menggunakan database di path: \${dbPath}\`);
const db = new Database(dbPath, { timeout: 15000 });`;

code = code.replace(oldInit, newInit);
fs.writeFileSync('server/db.ts', code);
