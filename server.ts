import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import nodemailer from "nodemailer";

const db = new Database("tickets.db");

// Email Transporter Setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true, // 465 requires secure: true
  auth: {
    user: process.env.SMTP_USER || 'itk3dk2026@gmail.com',
    pass: process.env.SMTP_PASS || 'wkizhrimtufuderw',
  },
});

async function sendNotificationEmail(ticket: any, emails: string[]) {
  console.log('Attempting to send email notification to:', emails);
  
  if (!emails || emails.length === 0) {
    console.log('Skipping email notification: No target emails provided');
    return;
  }

  // Check removed since we hardcoded the fallback values
  
  for (const email of emails) {
    const mailOptions = {
      from: process.env.SMTP_FROM || 'itk3dk2026@gmail.com',
      to: email,
      subject: `[New Ticket] ${ticket.ticket_no} - ${ticket.category}`,
      text: `Ada tiket baru masuk!\n\nNo Tiket: ${ticket.ticket_no}\nNama: ${ticket.name}\nDepartemen: ${ticket.department}\nKategori: ${ticket.category}\nDeskripsi: ${ticket.description}\n\nSilakan cek portal admin untuk detail lebih lanjut.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; color: #333;">
          <h2 style="color: #10b981; margin-top: 0;">Ada tiket baru masuk!</h2>
          <p>Halo Admin, ada laporan baru yang memerlukan perhatian Anda.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; font-weight: bold; width: 120px;">No Tiket:</td><td>${ticket.ticket_no}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Nama:</td><td>${ticket.name}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Departemen:</td><td>${ticket.department}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Kategori:</td><td>${ticket.category}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Deskripsi:</td><td>${ticket.description}</td></tr>
          </table>
          <div style="margin-top: 30px;">
            <a href="https://www.itk3dk.my.id/" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Buka Portal Admin</a>
          </div>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Notification email sent successfully to: ${email}`);
    } catch (error) {
      console.error(`Error sending notification email to ${email}:`, error);
    }
  }
}

async function sendTelegramNotification(ticket: any, botToken: string, chatIds: string[]) {
  const trimmedToken = botToken.trim();
  if (!trimmedToken || !chatIds || chatIds.length === 0) {
    console.log('Skipping Telegram notification: Missing token or chat IDs');
    return;
  }

  const message = `
<b>Ada Tiket Baru Masuk!</b>

<b>No Tiket:</b> ${ticket.ticket_no}
<b>Nama:</b> ${ticket.name}
<b>Departemen:</b> ${ticket.department}
<b>Kategori:</b> ${ticket.category}
<b>Deskripsi:</b> ${ticket.description || '-'}

<a href="https://www.itk3dk.my.id/">Buka Portal Admin</a>
  `.trim();

  for (const chatId of chatIds) {
    try {
      console.log(`Sending Telegram notification to ${chatId}...`);
      const response = await fetch(`https://api.telegram.org/bot${trimmedToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: false
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Telegram API error for ${chatId}:`, errorData);
      } else {
        console.log(`Telegram notification sent successfully to: ${chatId}`);
      }
    } catch (error) {
      console.error(`Error sending Telegram notification to ${chatId}:`, error);
    }
  }
}

// Create default users if not exists
// (Moved inside startServer)

async function startServer() {
  console.log("Starting server initialization...");
  const app = express();
  const PORT = 3000;

  // Add health check ASAP
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  console.log("Initializing database tables...");
  try {
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        responded_at DATETIME,
        resolved_at DATETIME,
        photo TEXT,
        ip_address TEXT,
        user_agent TEXT,
        latitude REAL,
        longitude REAL,
        internal_notes TEXT
      );

      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'staff',
        full_name TEXT
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
        name TEXT UNIQUE NOT NULL
      );
    `);
    console.log("Database tables checked/created.");
  } catch (err) {
    console.error("Database initialization error:", err);
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
      const insert = db.prepare("INSERT INTO categories (name) VALUES (?)");
      ['Synergi', 'SCM', 'MKT', 'Hardware', 'Jaringan'].forEach(name => insert.run(name));
    }

    // Add new columns if they don't exist (for existing databases)
    const columnsToEnsure = [
      "ticket_no TEXT", "description TEXT", "photo TEXT", "assigned_to TEXT", 
      "admin_reply TEXT", "internal_notes TEXT", "responded_at DATETIME", 
      "resolved_at DATETIME", "updated_at DATETIME DEFAULT CURRENT_TIMESTAMP",
      "ip_address TEXT", "user_agent TEXT", "latitude REAL", "longitude REAL"
    ];
    columnsToEnsure.forEach(col => {
      try { db.exec(`ALTER TABLE tickets ADD COLUMN ${col}`); } catch (e) {}
    });

    const userColumnsToEnsure = ["role TEXT DEFAULT 'staff'", "full_name TEXT"];
    userColumnsToEnsure.forEach(col => {
      try { db.exec(`ALTER TABLE users ADD COLUMN ${col}`); } catch (e) {}
    });

    // Initialize default settings
    const initSettings = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
    initSettings.run('app_name', 'IT Helpdesk Pro');
    initSettings.run('logo_type', 'ShieldCheck');
    initSettings.run('notification_emails', '[]');
    initSettings.run('telegram_bot_token', '');
    initSettings.run('telegram_chat_ids', '[]');

    // Create or update default users
    const usersToCreate = [
      { username: 'yudha', password: 'root', role: 'Super Admin', full_name: 'Yudha' },
      { username: 'bayu', password: 'root', role: 'Staff IT Support', full_name: 'Bayu' },
      { username: 'dita', password: 'root', role: 'Staff App Support', full_name: 'Dita' }
    ];
    usersToCreate.forEach(u => {
      const exists = db.prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(?)").get(u.username) as any;
      if (!exists) {
        db.prepare("INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)").run(u.username, u.password, u.role, u.full_name);
      } else {
        // Force update password to 'root' for prototype consistency
        db.prepare("UPDATE users SET password = ?, role = ?, full_name = ? WHERE id = ?").run(u.password, u.role, u.full_name, exists.id);
      }
    });
    // Create default users or update them
    // ... (already done)

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
    
    const allUsers = db.prepare("SELECT * FROM users").all();
    console.log("Current users in DB:", allUsers);
    console.log("Database data initialized.");
  } catch (err) {
    console.error("Database data init error:", err);
  }

  // API Routes
  app.get("/api/settings", (req, res) => {
    const settings = db.prepare("SELECT * FROM settings").all();
    const settingsObj = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsObj);
  });

  app.patch("/api/settings", (req, res) => {
    const body = req.body;
    const update = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
    Object.entries(body).forEach(([key, value]) => {
      update.run(key, String(value));
    });
    res.json({ success: true });
  });

  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const cleanUsername = String(username || '').trim();
    const cleanPassword = String(password || '').trim();
    
    console.log(`Login attempt for: ${cleanUsername}`);
    
    // For prototype, we allow case-insensitive password too to avoid frustration
    const user = db.prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(?) AND LOWER(password) = LOWER(?)").get(cleanUsername, cleanPassword) as any;
    
    if (user) {
      console.log(`Login success for: ${user.username}, Role: ${user.role}`);
      res.json({ 
        success: true, 
        user: { 
          username: user.username, 
          role: user.role, 
          full_name: user.full_name 
        } 
      });
    } else {
      console.log(`Login failed for: ${cleanUsername}`);
      res.status(401).json({ error: "Username atau Password salah" });
    }
  });

  app.post("/api/tickets/reset", (req, res) => {
    // In a real app, we'd check a token here. For this demo, we'll just allow it.
    db.prepare("DELETE FROM tickets").run();
    res.json({ success: true });
  });

  app.delete("/api/tickets/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM tickets WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Management Routes
  app.get("/api/it-personnel", (req, res) => {
    res.json(db.prepare("SELECT * FROM it_personnel ORDER BY name ASC").all());
  });
  app.post("/api/it-personnel", (req, res) => {
    const { name } = req.body;
    try {
      db.prepare("INSERT INTO it_personnel (name) VALUES (?)").run(name);
      res.json({ success: true });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.delete("/api/it-personnel/:id", (req, res) => {
    db.prepare("DELETE FROM it_personnel WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/departments", (req, res) => {
    res.json(db.prepare("SELECT * FROM departments ORDER BY name ASC").all());
  });
  app.post("/api/departments", (req, res) => {
    const { name } = req.body;
    try {
      db.prepare("INSERT INTO departments (name) VALUES (?)").run(name);
      res.json({ success: true });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.delete("/api/departments/:id", (req, res) => {
    db.prepare("DELETE FROM departments WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/categories", (req, res) => {
    res.json(db.prepare("SELECT * FROM categories ORDER BY name ASC").all());
  });
  app.post("/api/categories", (req, res) => {
    const { name } = req.body;
    try {
      db.prepare("INSERT INTO categories (name) VALUES (?)").run(name);
      res.json({ success: true });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.delete("/api/categories/:id", (req, res) => {
    db.prepare("DELETE FROM categories WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/tickets", (req, res) => {
    try {
      const { username, role } = req.query;
      // Exclude 'photo' from the list to keep payload small
      const columns = "id, ticket_no, name, department, phone, category, description, assigned_to, admin_reply, status, created_at, updated_at, responded_at, resolved_at, ip_address, user_agent, latitude, longitude, internal_notes";
      let tickets;
      if (role === 'Super Admin' || !username) {
        tickets = db.prepare(`SELECT ${columns} FROM tickets ORDER BY created_at DESC`).all();
      } else {
        tickets = db.prepare(`SELECT ${columns} FROM tickets WHERE assigned_to = ? ORDER BY created_at DESC`).all(username);
      }
      res.json(tickets);
    } catch (err: any) {
      console.error('Error fetching tickets:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/tickets/:id/photo", (req, res) => {
    try {
      const { id } = req.params;
      const ticket = db.prepare("SELECT photo FROM tickets WHERE id = ?").get(id) as { photo: string } | undefined;
      if (!ticket) return res.status(404).json({ error: "Ticket not found" });
      res.json({ photo: ticket.photo });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/tickets", (req, res) => {
    try {
      const { name, department, phone, category, description, photo, latitude, longitude } = req.body;
      console.log('Incoming ticket data:', { name, department, phone, category, hasPhoto: !!photo, lat: latitude, lng: longitude });
      
      if (!name || !department || !phone || !category) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Generate ticket_no: YYMMDDNNN
      const utcNow = new Date();
      const jakartaNow = new Date(utcNow.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
      // Use local time for the ticket number prefix as requested by user format
      const year = jakartaNow.getFullYear().toString().slice(-2);
      const month = (jakartaNow.getMonth() + 1).toString().padStart(2, '0');
      const day = jakartaNow.getDate().toString().padStart(2, '0');
      const datePrefix = `${year}${month}${day}`;

      // Find the latest ticket number for today
      const lastTicket = db.prepare("SELECT ticket_no FROM tickets WHERE ticket_no LIKE ? ORDER BY ticket_no DESC LIMIT 1")
        .get(`${datePrefix}%`) as { ticket_no: string } | undefined;

      let sequence = 1;
      if (lastTicket && lastTicket.ticket_no) {
        const lastSeq = parseInt(lastTicket.ticket_no.slice(-3));
        if (!isNaN(lastSeq)) {
          sequence = lastSeq + 1;
        }
      }
      const ticketNo = `${datePrefix}${sequence.toString().padStart(3, '0')}`;
      console.log('Generated ticketNo:', ticketNo);

      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      // Auto-mapping logic
      let assignedTo = 'yudha'; // Default
      if (['Hardware', 'Jaringan', 'MKT'].includes(category)) {
        assignedTo = 'bayu';
      } else if (['SCM', 'Synergi'].includes(category)) {
        assignedTo = 'dita';
      }

      const info = db.prepare(
        "INSERT INTO tickets (ticket_no, name, department, phone, category, description, photo, created_at, ip_address, user_agent, latitude, longitude, assigned_to, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).run(ticketNo, name, department, phone, category, description || "", photo || null, utcNow.toISOString(), String(ip), String(userAgent), latitude || null, longitude || null, assignedTo, 'New');
      
      const newTicket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(info.lastInsertRowid) as any;
      
      // Targeted Telegram Notification simulation
      console.log(`[TELEGRAM] Targeted Notification for ${assignedTo.toUpperCase()}: New ticket ${ticketNo} in category ${category}`);
      
      // Send Email Notification
      const notificationEmailsRaw = db.prepare("SELECT value FROM settings WHERE key = 'notification_emails'").get() as { value: string } | undefined;
      if (notificationEmailsRaw) {
        try {
          const emails = JSON.parse(notificationEmailsRaw.value);
          // Always include the test email if requested or just send to the list
          sendNotificationEmail(newTicket, emails);
        } catch (e) {
          console.error('Error parsing notification emails:', e);
        }
      }

      // Send Telegram Notification
      const telegramTokenRaw = db.prepare("SELECT value FROM settings WHERE key = 'telegram_bot_token'").get() as { value: string } | undefined;
      const telegramChatIdsRaw = db.prepare("SELECT value FROM settings WHERE key = 'telegram_chat_ids'").get() as { value: string } | undefined;
      
      if (telegramTokenRaw?.value && telegramChatIdsRaw?.value) {
        try {
          const chatIds = JSON.parse(telegramChatIdsRaw.value);
          sendTelegramNotification(newTicket, telegramTokenRaw.value, chatIds);
        } catch (e) {
          console.error('Error parsing telegram settings:', e);
        }
      }

      res.status(201).json(newTicket);
    } catch (err: any) {
      console.error('Error creating ticket:', err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  app.patch("/api/tickets/:id", (req, res) => {
    const { id } = req.params;
    const { status, assigned_to, admin_reply, internal_notes, takeover_by, reassign_to } = req.body;
    
    const currentTicket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(id) as any;
    if (!currentTicket) return res.status(404).json({ error: "Ticket not found" });

    let respondedAt = currentTicket.responded_at;
    let resolvedAt = currentTicket.resolved_at;
    let newStatus = status || currentTicket.status;
    let newAssignedTo = assigned_to || currentTicket.assigned_to;

    // Intervention logic for Yudha
    if (takeover_by) {
      newAssignedTo = takeover_by;
      console.log(`[INTERVENTION] Ticket ${currentTicket.ticket_no} taken over by ${takeover_by}`);
    } else if (reassign_to) {
      newAssignedTo = reassign_to;
      console.log(`[INTERVENTION] Ticket ${currentTicket.ticket_no} reassigned to ${reassign_to}`);
    }

    // Set responded_at if it's the first time admin replies or changes status from New
    if (!respondedAt && (admin_reply || newStatus !== 'New')) {
      respondedAt = new Date().toISOString();
    }

    // Set resolved_at if status is changed to Completed
    if (newStatus === 'Completed' && !resolvedAt) {
      resolvedAt = new Date().toISOString();
    } else if (newStatus !== 'Completed') {
      resolvedAt = null; // Reset if reopened
    }

    db.prepare("UPDATE tickets SET status = ?, assigned_to = ?, admin_reply = ?, internal_notes = ?, responded_at = ?, resolved_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(newStatus, newAssignedTo, admin_reply || currentTicket.admin_reply, internal_notes || currentTicket.internal_notes, respondedAt, resolvedAt, id);
    
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting Vite in middleware mode...");
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite middleware attached.");
    } catch (err) {
      console.error("Vite initialization error:", err);
    }
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is listening on 0.0.0.0:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
