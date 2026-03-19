import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

const db = new Database("tickets.db");

// Initialize database tables
export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_no TEXT UNIQUE,
      name TEXT NOT NULL,
      department TEXT NOT NULL,
      phone TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      assigned_to TEXT,
      admin_reply TEXT,
      status TEXT DEFAULT 'New',
      priority TEXT DEFAULT 'Medium',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      responded_at DATETIME,
      resolved_at DATETIME,
      photo TEXT,
      ip_address TEXT,
      user_agent TEXT,
      latitude REAL,
      longitude REAL,
      internal_notes TEXT,
      face_photo TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'staff',
      full_name TEXT,
      theme_mode TEXT DEFAULT 'light',
      primary_color TEXT DEFAULT '#8b5cf6'
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS it_personnel (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      assigned_to TEXT
    );

    CREATE TABLE IF NOT EXISTS ticket_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER,
      action TEXT,
      performed_by TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      details TEXT,
      FOREIGN KEY(ticket_id) REFERENCES tickets(id)
    );

    CREATE TABLE IF NOT EXISTS master_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT UNIQUE NOT NULL,
      department TEXT NOT NULL,
      phone TEXT,
      employee_index TEXT,
      email TEXT
    );

    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_tag TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      brand TEXT,
      model TEXT,
      serial_number TEXT,
      department TEXT,
      user_name TEXT,
      status TEXT DEFAULT 'Active',
      purchase_date DATE,
      warranty_expiry DATE,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Add missing columns if they don't exist
  const tables = ['tickets', 'users', 'categories', 'master_users'];
  for (const table of tables) {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
    
    if (table === 'tickets') {
      if (!columns.find(c => c.name === 'face_photo')) {
        db.prepare("ALTER TABLE tickets ADD COLUMN face_photo TEXT").run();
      }
      if (!columns.find(c => c.name === 'updated_at')) {
        db.prepare("ALTER TABLE tickets ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP").run();
      }
      if (!columns.find(c => c.name === 'internal_notes')) {
        db.prepare("ALTER TABLE tickets ADD COLUMN internal_notes TEXT").run();
      }
      if (!columns.find(c => c.name === 'responded_at')) {
        db.prepare("ALTER TABLE tickets ADD COLUMN responded_at DATETIME").run();
      }
      if (!columns.find(c => c.name === 'resolved_at')) {
        db.prepare("ALTER TABLE tickets ADD COLUMN resolved_at DATETIME").run();
      }
      if (!columns.find(c => c.name === 'priority')) {
        db.prepare("ALTER TABLE tickets ADD COLUMN priority TEXT DEFAULT 'Medium'").run();
      }
    }
    
    if (table === 'users') {
      if (!columns.find(c => c.name === 'theme_mode')) {
        db.prepare("ALTER TABLE users ADD COLUMN theme_mode TEXT DEFAULT 'light'").run();
      }
      if (!columns.find(c => c.name === 'primary_color')) {
        db.prepare("ALTER TABLE users ADD COLUMN primary_color TEXT DEFAULT '#8b5cf6'").run();
      }
    }

    if (table === 'categories') {
      if (!columns.find(c => c.name === 'assigned_to')) {
        db.prepare("ALTER TABLE categories ADD COLUMN assigned_to TEXT").run();
      }
    }

    if (table === 'master_users') {
      if (!columns.find(c => c.name === 'employee_index')) {
        db.prepare("ALTER TABLE master_users ADD COLUMN employee_index TEXT").run();
      }
      if (!columns.find(c => c.name === 'email')) {
        db.prepare("ALTER TABLE master_users ADD COLUMN email TEXT").run();
      }
    }
  }

  // Initialize default data if tables are empty
  try {
    const itCount = db.prepare("SELECT COUNT(*) as count FROM it_personnel").get() as { count: number };
    if (itCount.count === 0) {
      const insert = db.prepare("INSERT INTO it_personnel (name) VALUES (?)");
      ['Yudha', 'Bayu', 'Dita'].forEach(name => insert.run(name));
    }

    const deptCount = db.prepare("SELECT COUNT(*) as count FROM departments").get() as { count: number };
    if (deptCount.count === 0) {
      const insert = db.prepare("INSERT INTO departments (name) VALUES (?)");
      ['HRGA', 'CE Business', 'Fleet Business', 'Accounting', 'Treasury & Financing', 'Store Retail', 'Supply Chain', 'Other Retail', 'OSS', 'PT DKU'].forEach(name => insert.run(name));
    }

    const catCount = db.prepare("SELECT COUNT(*) as count FROM categories").get() as { count: number };
    if (catCount.count === 0) {
      const insert = db.prepare("INSERT INTO categories (name, assigned_to) VALUES (?, ?)");
      [
        ['Hardware', 'bayu'],
        ['Jaringan', 'bayu'],
        ['MKT', 'bayu'],
        ['SCM', 'dita'],
        ['Synergi', 'dita']
      ].forEach(c => insert.run(c[0], c[1]));
    }

    const masterUserCount = db.prepare("SELECT COUNT(*) as count FROM master_users").get() as { count: number };
    if (masterUserCount.count === 0) {
      const insert = db.prepare("INSERT INTO master_users (full_name, department, phone, employee_index) VALUES (?, ?, ?, ?)");
      [
        ['Budi Santoso', 'HRGA', '081234567890', '12345'],
        ['Siti Aminah', 'CE Business', '081234567891', '67890'],
        ['Andi Wijaya', 'Fleet Business', '081234567892', '11223']
      ].forEach(u => insert.run(u[0], u[1], u[2], u[3]));
    }

    // Initialize default settings
    const initSettings = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
    initSettings.run('app_name', 'IT Helpdesk K3DK');
    initSettings.run('logo_type', 'ShieldCheck');
    initSettings.run('notification_emails', '[]');
    initSettings.run('telegram_bot_token', '');
    initSettings.run('telegram_chat_ids', '[]');
    initSettings.run('custom_logo', '');
    initSettings.run('custom_favicon', '');
    initSettings.run('photo_cleanup_duration', '24');

    // Create or update default users
    const usersToCreate = [
      { username: 'yudha', password: 'root', role: 'Super Admin', full_name: 'Yudha' },
      { username: 'bayu', password: 'root', role: 'Staff IT Support', full_name: 'Bayu' },
      { username: 'dita', password: 'root', role: 'Staff App Support', full_name: 'Dita' }
    ];
    
    usersToCreate.forEach(u => {
      const exists = db.prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(?)").get(u.username) as any;
      const hashedPassword = bcrypt.hashSync(u.password, 10);
      
      if (!exists) {
        db.prepare("INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)").run(u.username, hashedPassword, u.role, u.full_name);
      } else {
        // Only update password if it's not already hashed (simple check: bcrypt hashes usually start with $2)
        if (!exists.password.startsWith('$2')) {
          db.prepare("UPDATE users SET password = ?, role = ?, full_name = ? WHERE id = ?").run(hashedPassword, u.role, u.full_name, exists.id);
        } else {
          db.prepare("UPDATE users SET role = ?, full_name = ? WHERE id = ?").run(u.role, u.full_name, exists.id);
        }
      }
    });

    // Add sample tickets if table is empty
    const ticketCount = db.prepare("SELECT COUNT(*) as count FROM tickets").get() as { count: number };
    if (ticketCount.count === 0) {
      const insert = db.prepare(`
        INSERT INTO tickets (ticket_no, name, department, phone, category, description, assigned_to, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insert.run('TKT-0001', 'Budi', 'HRGA', '08123456789', 'Hardware', 'Laptop tidak bisa nyala', 'bayu', 'In Progress');
      insert.run('TKT-0002', 'Siti', 'CE Business', '08123456788', 'SCM', 'Akses SCM ditolak', 'dita', 'New');
      insert.run('TKT-0003', 'Andi', 'Fleet Business', '08123456787', 'Jaringan', 'Wifi lemot di lantai 2', 'bayu', 'New');
    }
    
    console.log("Database data initialized.");
  } catch (err) {
    console.error("Database data init error:", err);
  }
}

export default db;
