import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

const db = new Database("tickets.db", { timeout: 15000 });
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");
db.pragma("busy_timeout = 15000");

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
      face_photo TEXT,
      employee_index TEXT,
      device_type TEXT,
      pc_code TEXT
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
      assigned_to TEXT,
      response_time INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS ticket_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER,
      action TEXT,
      note TEXT,
      performed_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(ticket_id) REFERENCES tickets(id)
    );

    CREATE TABLE IF NOT EXISTS master_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT UNIQUE NOT NULL,
      department TEXT NOT NULL,
      phone TEXT,
      employee_index TEXT,
      email TEXT,
      jenis_piranti TEXT,
      kode_piranti TEXT
    );

    CREATE TABLE IF NOT EXISTS assets (
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS network_devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      ip_address TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      location TEXT,
      status TEXT DEFAULT 'Unknown',
      last_checked DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS memberships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kode_lokal TEXT,
      indek_kdk TEXT,
      indek_ggf TEXT,
      nama TEXT NOT NULL,
      bagian TEXT,
      barcode TEXT,
      foto TEXT,
      nik_ktp TEXT,
      no_hp TEXT,
      photo_scale REAL DEFAULT 1.0,
      photo_offset_x REAL DEFAULT 50.0,
      photo_offset_y REAL DEFAULT 50.0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS membership_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      membership_id INTEGER NOT NULL,
      keterangan TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS membership_journals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER,
      nama TEXT NOT NULL,
      kode_lokal TEXT,
      indek_ggf TEXT,
      bagian TEXT,
      barcode TEXT,
      signature TEXT,
      keterangan TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES memberships(id) ON DELETE SET NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS eval_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      target_users INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS eval_project_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      user_name TEXT,
      department TEXT,
      activity_date DATE NOT NULL,
      activity_type TEXT,
      usage_count INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES eval_projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS eval_project_timeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      target_date DATE NOT NULL,
      status TEXT DEFAULT 'pending', -- 'pending', 'on_progress', 'completed'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES eval_projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS eval_m365_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      periode_bulan TEXT,
      user_principal_name TEXT,
      display_name TEXT,
      department TEXT,
      activet TEXT,
      license_m365 TEXT,
      email_exchange TEXT,
      one_drive TEXT,
      storage_used TEXT,
      teams TEXT,
      reason_teams TEXT,
      outlook_for_mobile TEXT,
      reason_hp TEXT,
      outlook_for_web TEXT,
      reason_web TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES eval_projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS berita_acara (
      id TEXT PRIMARY KEY,
      created_at TEXT,
      doc_type TEXT,
      recommender_name TEXT,
      recommender_dept TEXT,
      recommendee_name TEXT,
      recommendee_dept TEXT,
      recommendee_position TEXT,
      reason TEXT,
      location TEXT,
      date TEXT
    );

    CREATE TABLE IF NOT EXISTS voucher_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requester_name TEXT NOT NULL,
      department TEXT NOT NULL,
      deadline TEXT NOT NULL,
      theme TEXT NOT NULL,
      slogan TEXT,
      validity_date TEXT NOT NULL,
      qty INTEGER NOT NULL,
      status TEXT DEFAULT 'Baru Diminta', -- 'Baru Diminta', 'Proses', 'Done'
      created_by TEXT,
      voucher_value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  try {
    const projectCount = db.prepare("SELECT COUNT(*) as count FROM eval_projects").get() as any;
    if (projectCount && projectCount.count === 0) {
      const m365Id = db.prepare("INSERT INTO eval_projects (name, description, target_users) VALUES (?, ?, ?)").run(
        "Project m365",
        "Evaluasi penggunaan Microsoft 365 (Word, Excel, Teams, Outlook, OneDrive) di lingkup perusahaan.",
        150
      ).lastInsertRowid;

      const waId = db.prepare("INSERT INTO eval_projects (name, description, target_users) VALUES (?, ?, ?)").run(
        "Project Whatsapp Omni",
        "Analisa aktivitas komunikasi pelanggan dan internal menggunakan sistem Whatsapp Omnichannel.",
        100
      ).lastInsertRowid;

      // Seed M365 Milestones
      const m365Timeline = [
        { title: "Kickoff & Sosialisasi", desc: "Pertemuan pembukaan dan sosialisasi penggunaan lisensi M365", date: "2026-06-01", status: "completed" },
        { title: "Setup Akun & Install", desc: "Konfigurasi admin portal, pembagian lisensi, dan installasi aplikasi client", date: "2026-06-15", status: "completed" },
        { title: "Pelatihan Karyawan", desc: "Training modul dasar Outlook, Word, Excel, & kolaborasi Teams", date: "2026-07-01", status: "on_progress" },
        { title: "Evaluasi Pemakaian Tahap 1", desc: "Review awal penyerapan adopsi & feedback kendala teknis pengguna", date: "2026-07-15", status: "pending" },
        { title: "Migrasi OneDrive Penuh", desc: "Pemindahan berkas kerja personal ke cloud storage OneDrive", date: "2026-08-01", status: "pending" }
      ];

      // Seed WA Milestones
      const waTimeline = [
        { title: "Integrasi API & Sandbox", desc: "Setup WhatsApp Business API and channel integration", date: "2026-06-05", status: "completed" },
        { title: "Konfigurasi Omni Inbox", desc: "Pendaftaran akun agen CS dan pengaturan antrean chat", date: "2026-06-20", status: "completed" },
        { title: "Uji Coba Terbatas (UAT)", desc: "Simulasi penerimaan chat pelanggan oleh tim Customer Service", date: "2026-07-05", status: "on_progress" },
        { title: "Go Live & Publikasi", desc: "Rilis resmi nomor kontak WA untuk seluruh pelanggan perusahaan", date: "2026-07-20", status: "pending" }
      ];

      const insertTimeline = db.prepare("INSERT INTO eval_project_timeline (project_id, title, description, target_date, status) VALUES (?, ?, ?, ?, ?)");
      for (const t of m365Timeline) {
        insertTimeline.run(m365Id, t.title, t.desc, t.date, t.status);
      }
      for (const t of waTimeline) {
        insertTimeline.run(waId, t.title, t.desc, t.date, t.status);
      }
    }
  } catch (err) {
    console.error("Error seeding eval_projects:", err);
  }

  // Add missing columns if they don't exist
  const tables = ['tickets', 'users', 'categories', 'master_users', 'ticket_logs', 'memberships', 'membership_logs', 'assets', 'voucher_requests', 'eval_m365_usage'];
  for (const table of tables) {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
    
    if (table === 'eval_m365_usage') {
      if (!columns.find(c => c.name === 'license_m365')) {
        db.prepare("ALTER TABLE eval_m365_usage ADD COLUMN license_m365 TEXT").run();
      }
    }

    if (table === 'voucher_requests') {
      if (!columns.find(c => c.name === 'design_data')) {
        db.prepare("ALTER TABLE voucher_requests ADD COLUMN design_data TEXT").run();
      }
      if (!columns.find(c => c.name === 'slogan')) {
        db.prepare("ALTER TABLE voucher_requests ADD COLUMN slogan TEXT").run();
      }
      if (!columns.find(c => c.name === 'created_by')) {
        db.prepare("ALTER TABLE voucher_requests ADD COLUMN created_by TEXT").run();
      }
      if (!columns.find(c => c.name === 'voucher_value')) {
        db.prepare("ALTER TABLE voucher_requests ADD COLUMN voucher_value TEXT").run();
      }
    }

    if (table === 'assets') {
      if (columns.find(c => c.name === 'asset_tag')) {
        db.prepare("DROP TABLE assets").run();
        db.prepare(`
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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run();
      }
    }

    if (table === 'memberships') {
      if (!columns.find(c => c.name === 'nik_ktp')) {
        db.prepare("ALTER TABLE memberships ADD COLUMN nik_ktp TEXT").run();
      }
      if (!columns.find(c => c.name === 'no_hp')) {
        db.prepare("ALTER TABLE memberships ADD COLUMN no_hp TEXT").run();
      }
      if (!columns.find(c => c.name === 'photo_scale')) {
        db.prepare("ALTER TABLE memberships ADD COLUMN photo_scale REAL DEFAULT 1.0").run();
      }
      if (!columns.find(c => c.name === 'photo_offset_x')) {
        db.prepare("ALTER TABLE memberships ADD COLUMN photo_offset_x REAL DEFAULT 50.0").run();
      }
      if (!columns.find(c => c.name === 'photo_offset_y')) {
        db.prepare("ALTER TABLE memberships ADD COLUMN photo_offset_y REAL DEFAULT 50.0").run();
      }
      if (!columns.find(c => c.name === 'updated_at')) {
        db.prepare("ALTER TABLE memberships ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP").run();
      }
    }
    
    if (table === 'ticket_logs') {
      if (columns.find(c => c.name === 'timestamp') && !columns.find(c => c.name === 'created_at')) {
        db.prepare("ALTER TABLE ticket_logs RENAME COLUMN timestamp TO created_at").run();
      }
      if (columns.find(c => c.name === 'details') && !columns.find(c => c.name === 'note')) {
        db.prepare("ALTER TABLE ticket_logs RENAME COLUMN details TO note").run();
      }
    }
    
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
      if (!columns.find(c => c.name === 'employee_index')) {
        db.prepare("ALTER TABLE tickets ADD COLUMN employee_index TEXT").run();
      }
      if (!columns.find(c => c.name === 'device_type')) {
        db.prepare("ALTER TABLE tickets ADD COLUMN device_type TEXT").run();
      }
      if (!columns.find(c => c.name === 'pc_code')) {
        db.prepare("ALTER TABLE tickets ADD COLUMN pc_code TEXT").run();
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
      if (!columns.find(c => c.name === 'jenis_piranti')) {
        db.prepare("ALTER TABLE master_users ADD COLUMN jenis_piranti TEXT").run();
      }
      if (!columns.find(c => c.name === 'kode_piranti')) {
        db.prepare("ALTER TABLE master_users ADD COLUMN kode_piranti TEXT").run();
      }
      if (!columns.find(c => c.name === 'jabatan')) {
        db.prepare("ALTER TABLE master_users ADD COLUMN jabatan TEXT").run();
      }
      if (!columns.find(c => c.name === 'can_request_voucher')) {
        db.prepare("ALTER TABLE master_users ADD COLUMN can_request_voucher INTEGER DEFAULT 0").run();
      }
      if (!columns.find(c => c.name === 'enable_funny_egg')) {
        db.prepare("ALTER TABLE master_users ADD COLUMN enable_funny_egg INTEGER DEFAULT 0").run();
      }
      db.prepare("UPDATE master_users SET jenis_piranti = '(Tidak Ada)' WHERE jenis_piranti IS NULL OR jenis_piranti = ''").run();
      db.prepare("UPDATE master_users SET kode_piranti = '-' WHERE kode_piranti IS NULL OR kode_piranti = ''").run();
      db.prepare("UPDATE master_users SET jabatan = '-' WHERE jabatan IS NULL OR jabatan = ''").run();
      
      // Seed 'Dita Faradila' if she doesn't exist
      const ditaExists = db.prepare("SELECT COUNT(*) as count FROM master_users WHERE full_name = 'Dita Faradila'").get() as { count: number };
      if (ditaExists.count === 0) {
        db.prepare("INSERT INTO master_users (full_name, department, phone, employee_index, enable_funny_egg, jabatan) VALUES ('Dita Faradila', 'OSS', '081298765432', '14022', 1, 'Staff App Support')").run();
      }
    }

    // Add role to it_personnel if not exists
    {
      const columns = db.pragma("table_info(it_personnel)") as { name: string }[];
      if (!columns.find(c => c.name === 'role')) {
        db.prepare("ALTER TABLE it_personnel ADD COLUMN role TEXT").run();
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
    initSettings.run('login_guide_enabled', 'true');
    initSettings.run('login_guide_content', 'Langkah-langkah Login:\n1. Pilih nama Anda pada pilihan "Nama Anda".\n2. Ketik Index KDK/GGF Anda dengan benar.\n3. Tekan tombol "Masuk" untuk masuk ke dashboard.\n\nJika nama Anda belum terdaftar, silakan hubungi tim Admin IT.');
    initSettings.run('app_version', 'v1.3.0');

    // Create or update default users
    const usersToCreate = [
      { username: 'admin', password: 'admin', role: 'Super Admin', full_name: 'Administrator' },
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
    
    // Add column response_time to categories table if not exists (migration)
    try {
      db.prepare("ALTER TABLE categories ADD COLUMN response_time INTEGER DEFAULT 0").run();
      console.log("Migration: Added response_time column to categories table.");
    } catch (colErr) {
      // Column already exists, ignore
    }

    console.log("Database data initialized.");
  } catch (err) {
    console.error("Database data init error:", err);
  }
}

export default db;
