import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("tickets.db");

// Initialize database
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
    status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    responded_at DATETIME,
    resolved_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'admin'
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Add new columns if they don't exist (for existing databases)
try {
  db.exec("ALTER TABLE tickets ADD COLUMN ticket_no TEXT");
  console.log("Added ticket_no column");
} catch (e: any) {
  console.log("ticket_no column check:", e.message);
}
try {
  db.exec("ALTER TABLE tickets ADD COLUMN description TEXT");
} catch (e) {}

try {
  db.exec("ALTER TABLE tickets ADD COLUMN photo TEXT");
} catch (e) {}

// Log current columns for debugging
const tableInfo = db.prepare("PRAGMA table_info(tickets)").all();
console.log("Tickets table columns:", tableInfo.map((c: any) => c.name).join(", "));
try {
  db.exec("ALTER TABLE tickets ADD COLUMN assigned_to TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE tickets ADD COLUMN admin_reply TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE tickets ADD COLUMN responded_at DATETIME");
} catch (e) {}
try {
  db.exec("ALTER TABLE tickets ADD COLUMN resolved_at DATETIME");
} catch (e) {}

// Initialize default settings
const initSettings = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
initSettings.run('app_name', 'IT Helpdesk Pro');
initSettings.run('logo_type', 'ShieldCheck');

// Create default admin if not exists
const rootExists = db.prepare("SELECT * FROM users WHERE username = 'root'").get();
if (!rootExists) {
  db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run('root', 'root');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
    const { app_name, logo_type } = req.body;
    if (app_name) db.prepare("UPDATE settings SET value = ? WHERE key = 'app_name'").run(app_name);
    if (logo_type) db.prepare("UPDATE settings SET value = ? WHERE key = 'logo_type'").run(logo_type);
    res.json({ success: true });
  });

  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password);
    if (user) {
      res.json({ success: true, user: { username: user.username, role: user.role } });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/tickets/reset", (req, res) => {
    // In a real app, we'd check a token here. For this demo, we'll just allow it.
    db.prepare("DELETE FROM tickets").run();
    res.json({ success: true });
  });

  app.get("/api/tickets", (req, res) => {
    try {
      const tickets = db.prepare("SELECT * FROM tickets ORDER BY created_at DESC").all();
      res.json(tickets);
    } catch (err: any) {
      console.error('Error fetching tickets:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/tickets", (req, res) => {
    try {
      const { name, department, phone, category, description, photo } = req.body;
      console.log('Incoming ticket data:', { name, department, phone, category, hasPhoto: !!photo });
      
      if (!name || !department || !phone || !category) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Generate ticket_no: YYMMDDNNN
      const now = new Date();
      // Use local time for the ticket number prefix as requested by user format
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
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

      const info = db.prepare(
        "INSERT INTO tickets (ticket_no, name, department, phone, category, description, photo, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).run(ticketNo, name, department, phone, category, description || "", photo || null, now.toISOString());
      
      const newTicket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(info.lastInsertRowid);
      res.status(201).json(newTicket);
    } catch (err: any) {
      console.error('Error creating ticket:', err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  app.patch("/api/tickets/:id", (req, res) => {
    const { id } = req.params;
    const { status, assigned_to, admin_reply } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const currentTicket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(id) as any;
    if (!currentTicket) return res.status(404).json({ error: "Ticket not found" });

    let respondedAt = currentTicket.responded_at;
    let resolvedAt = currentTicket.resolved_at;

    // Set responded_at if it's the first time admin replies or changes status from Pending
    if (!respondedAt && (admin_reply || status !== 'Pending')) {
      respondedAt = new Date().toISOString();
    }

    // Set resolved_at if status is changed to Resolved
    if (status === 'Resolved' && !resolvedAt) {
      resolvedAt = new Date().toISOString();
    } else if (status !== 'Resolved') {
      resolvedAt = null; // Reset if reopened
    }

    db.prepare("UPDATE tickets SET status = ?, assigned_to = ?, admin_reply = ?, responded_at = ?, resolved_at = ? WHERE id = ?")
      .run(status, assigned_to || null, admin_reply || null, respondedAt, resolvedAt, id);
    
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
