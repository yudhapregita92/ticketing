import express from "express";
import db from "../db.ts";
import multer from "multer";
import * as xlsx from "xlsx";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { AppError } from "../utils/errors.ts";
import { Server } from "socket.io";

export default function masterDataRouter(io: Server) {
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const emitUpdate = () => {
  io.emit("master_data_updated");
};

// Batch endpoints to prevent 429 Rate Exceeded on initial load
router.get("/master-data/all", asyncHandler(async (req, res) => {
  const it = db.prepare("SELECT * FROM it_personnel ORDER BY name ASC").all();
  const depts = db.prepare("SELECT * FROM departments ORDER BY name ASC").all();
  const cats = db.prepare("SELECT * FROM categories ORDER BY name ASC").all();
  const users = db.prepare("SELECT * FROM users ORDER BY username ASC").all();
  const masters = db.prepare("SELECT * FROM master_users ORDER BY full_name ASC").all();
  const admins = db.prepare("SELECT id, username, full_name, role FROM users WHERE role != 'staff' ORDER BY username ASC").all();
  res.json({ it, depts, cats, users, masters, admins });
}));

router.get("/public-data/all", asyncHandler(async (req, res) => {
  const depts = db.prepare("SELECT * FROM departments ORDER BY name ASC").all();
  const cats = db.prepare("SELECT * FROM categories ORDER BY name ASC").all();
  const masters = db.prepare("SELECT * FROM master_users ORDER BY full_name ASC").all();
  res.json({ depts, cats, masters });
}));

// IT Personnel
router.get("/it-personnel", asyncHandler(async (req, res) => {
  res.json(db.prepare("SELECT * FROM it_personnel ORDER BY name ASC").all());
}));

router.post("/it-personnel", asyncHandler(async (req, res) => {
  const { name, role } = req.body;
  db.prepare("INSERT INTO it_personnel (name, role) VALUES (?, ?)").run(name, role || null);
  emitUpdate();
  res.json({ success: true });
}));

router.put("/it-personnel/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, role } = req.body;
  db.prepare("UPDATE it_personnel SET name = ?, role = ? WHERE id = ?").run(name, role || null, id);
  emitUpdate();
  res.json({ success: true });
}));

router.delete("/it-personnel/:id", asyncHandler(async (req, res) => {
  db.prepare("DELETE FROM it_personnel WHERE id = ?").run(req.params.id);
  emitUpdate();
  res.json({ success: true });
}));

// Departments
router.get("/departments", asyncHandler(async (req, res) => {
  res.json(db.prepare("SELECT * FROM departments ORDER BY name ASC").all());
}));

router.post("/departments", asyncHandler(async (req, res) => {
  const { name } = req.body;
  db.prepare("INSERT INTO departments (name) VALUES (?)").run(name);
  emitUpdate();
  res.json({ success: true });
}));

router.put("/departments/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  db.prepare("UPDATE departments SET name = ? WHERE id = ?").run(name, id);
  emitUpdate();
  res.json({ success: true });
}));

router.delete("/departments/:id", asyncHandler(async (req, res) => {
  db.prepare("DELETE FROM departments WHERE id = ?").run(req.params.id);
  emitUpdate();
  res.json({ success: true });
}));

// Categories
router.get("/categories", asyncHandler(async (req, res) => {
  res.json(db.prepare("SELECT * FROM categories ORDER BY name ASC").all());
}));

router.post("/categories", asyncHandler(async (req, res) => {
  const { name, assigned_to, response_time } = req.body;
  db.prepare("INSERT INTO categories (name, assigned_to, response_time) VALUES (?, ?, ?)").run(
    name, 
    assigned_to || null, 
    response_time ? parseInt(String(response_time), 10) : 0
  );
  emitUpdate();
  res.json({ success: true });
}));

router.put("/categories/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, assigned_to, response_time } = req.body;
  db.prepare("UPDATE categories SET name = ?, assigned_to = ?, response_time = ? WHERE id = ?").run(
    name, 
    assigned_to || null, 
    response_time ? parseInt(String(response_time), 10) : 0, 
    id
  );
  emitUpdate();
  res.json({ success: true });
}));

router.delete("/categories/:id", asyncHandler(async (req, res) => {
  db.prepare("DELETE FROM categories WHERE id = ?").run(req.params.id);
  emitUpdate();
  res.json({ success: true });
}));

// Master Users
function normalizeJenisPiranti(val: any): string {
  if (!val) return '(Tidak Ada)';
  const norm = String(val).trim().toLowerCase();
  if (norm === 'komputer' || norm === 'pc' || norm === 'komputer pc' || norm === 'desktop' || norm === 'computer' || norm === 'cpu') {
    return 'Komputer';
  }
  if (norm === 'laptop' || norm === 'notebook' || norm === 'netbook' || norm === 'macbook') {
    return 'Laptop';
  }
  if (norm === 'tab' || norm === 'tablet' || norm === 'smartphone' || norm === 'hp' || norm === 'android' || norm === 'ios' || norm === 'handphone' || norm === 'phone') {
    return 'TAB';
  }
  return '(Tidak Ada)';
}

router.get("/master-users", asyncHandler(async (req, res) => {
  res.json(db.prepare("SELECT * FROM master_users ORDER BY full_name ASC").all());
}));

router.post("/master-users", asyncHandler(async (req, res) => {
  const { full_name, department, phone, employee_index, email, jenis_piranti, kode_piranti, jabatan } = req.body;
  const normalizedPiranti = normalizeJenisPiranti(jenis_piranti);
  db.prepare("INSERT INTO master_users (full_name, department, phone, employee_index, email, jenis_piranti, kode_piranti, jabatan) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
    full_name ? String(full_name).trim() : '',
    department ? String(department).trim() : '-',
    phone ? String(phone).trim() : '-',
    employee_index ? String(employee_index).trim() : '-',
    email ? String(email).trim() : '-',
    normalizedPiranti,
    kode_piranti ? String(kode_piranti).trim() : '-',
    jabatan ? String(jabatan).trim() : '-'
  );
  emitUpdate();
  res.json({ success: true });
 }));
 
 router.put("/master-users/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { full_name, department, phone, employee_index, email, jenis_piranti, kode_piranti, jabatan } = req.body;
  const normalizedPiranti = normalizeJenisPiranti(jenis_piranti);
  db.prepare("UPDATE master_users SET full_name = ?, department = ?, phone = ?, employee_index = ?, email = ?, jenis_piranti = ?, kode_piranti = ?, jabatan = ? WHERE id = ?").run(
    full_name ? String(full_name).trim() : '',
    department ? String(department).trim() : '-',
    phone ? String(phone).trim() : '-',
    employee_index ? String(employee_index).trim() : '-',
    email ? String(email).trim() : '-',
    normalizedPiranti,
    kode_piranti ? String(kode_piranti).trim() : '-',
    jabatan ? String(jabatan).trim() : '-',
    id
  );
  emitUpdate();
  res.json({ success: true });
 }));
 
 router.delete("/master-users/:id", asyncHandler(async (req, res) => {
   db.prepare("DELETE FROM master_users WHERE id = ?").run(req.params.id);
   emitUpdate();
   res.json({ success: true });
 }));
 
 router.post("/master-users/upload", upload.single('file'), asyncHandler(async (req, res) => {
   if (!req.file) {
     throw new AppError("No file uploaded", 400);
   }
   
   const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
   const sheetName = workbook.SheetNames[0];
   const sheet = workbook.Sheets[sheetName];
   const data = xlsx.utils.sheet_to_json(sheet);
   
   const insert = db.prepare("INSERT OR REPLACE INTO master_users (full_name, department, phone, employee_index, email, jenis_piranti, kode_piranti, jabatan) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
   
   let count = 0;
   
   const findValue = (row: any, possibleHeaders: string[]) => {
     const keys = Object.keys(row);
     const matchedKey = keys.find(k => {
       const normKey = k.trim().toLowerCase().replace(/[\s_-]+/g, '');
       return possibleHeaders.some(h => h.trim().toLowerCase().replace(/[\s_-]+/g, '') === normKey);
     });
     return matchedKey ? row[matchedKey] : null;
   };
 
   db.transaction(() => {
     for (const row of data as any[]) {
       const fullName = findValue(row, ['Nama Lengkap', 'Nama', 'full_name', 'name', 'Nama User']);
       const department = findValue(row, ['Bagian / Departemen', 'Bagian', 'Departemen', 'department', 'dept', 'Unit']);
       const phone = findValue(row, ['No. Telepon', 'No Telepon', 'No HP', 'Telepon', 'phone', 'no_hp', 'Handphone']);
       const employeeIndex = findValue(row, ['Index Karyawan', 'Index', 'Indek', 'Indeks', 'employee_index', 'NIK']);
       const email = findValue(row, ['Email', 'email', 'Alamat Email']);
       const jenisPirantiRaw = findValue(row, ['Jenis Piranti', 'jenis_piranti', 'Piranti', 'Device Type', 'Jenis Device', 'Device']);
       const kodePirantiRaw = findValue(row, ['Kode Piranti', 'kode_piranti', 'Device Code', 'Kode Device', 'Kode']);
       const jabatanRaw = findValue(row, ['Jabatan', 'jabatan', 'Position', 'Role', 'Title', 'Pekerjaan']);
       
       const normalizedPiranti = normalizeJenisPiranti(jenisPirantiRaw);
       
       if (fullName) {
         insert.run(
           String(fullName).trim(), 
           department ? String(department).trim() : '-', 
           phone ? String(phone).trim() : '-', 
           employeeIndex ? String(employeeIndex).trim() : '-', 
           email ? String(email).trim() : '-', 
           normalizedPiranti,
           kodePirantiRaw ? String(kodePirantiRaw).trim() : '-',
           jabatanRaw ? String(jabatanRaw).trim() : '-'
         );
         count++;
       }
     }
   })();
  
  emitUpdate();
  res.json({ success: true, count });
}));

  // Voucher Request Toggle
  router.put("/master-users/:id/toggle-voucher", asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const { can_request_voucher } = req.body;
    db.prepare("UPDATE master_users SET can_request_voucher = ? WHERE id = ?").run(
      can_request_voucher ? 1 : 0,
      id
    );
    emitUpdate();
    res.json({ success: true });
  }));

  // Funny Egg Toggle
  router.put("/master-users/:id/toggle-funny-egg", asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const { enable_funny_egg } = req.body;
    db.prepare("UPDATE master_users SET enable_funny_egg = ? WHERE id = ?").run(
      enable_funny_egg ? 1 : 0,
      id
    );
    emitUpdate();
    res.json({ success: true });
  }));

  // Berita Acara
  router.get("/berita-acara", asyncHandler(async (req: any, res: any) => {
    const docs = db.prepare("SELECT * FROM berita_acara ORDER BY created_at DESC").all();
    res.json(docs.map((d: any) => ({
      id: d.id,
      createdAt: d.created_at,
      docType: d.doc_type,
      recommenderName: d.recommender_name,
      recommenderDept: d.recommender_dept,
      recommendeeName: d.recommendee_name,
      recommendeeDept: d.recommendee_dept,
      recommendeePosition: d.recommendee_position,
      reason: d.reason,
      location: d.location,
      date: d.date
    })));
  }));

  router.post("/berita-acara", asyncHandler(async (req: any, res: any) => {
    const doc = req.body;
    db.prepare(`
      INSERT INTO berita_acara (id, created_at, doc_type, recommender_name, recommender_dept, recommendee_name, recommendee_dept, recommendee_position, reason, location, date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        doc_type=excluded.doc_type,
        recommender_name=excluded.recommender_name,
        recommender_dept=excluded.recommender_dept,
        recommendee_name=excluded.recommendee_name,
        recommendee_dept=excluded.recommendee_dept,
        recommendee_position=excluded.recommendee_position,
        reason=excluded.reason,
        location=excluded.location,
        date=excluded.date
    `).run(
      doc.id,
      doc.createdAt || new Date().toISOString(),
      doc.docType,
      doc.recommenderName,
      doc.recommenderDept,
      doc.recommendeeName,
      doc.recommendeeDept,
      doc.recommendeePosition,
      doc.reason,
      doc.location,
      doc.date
    );
    res.json({ success: true, id: doc.id });
  }));

  router.delete("/berita-acara/:id", asyncHandler(async (req: any, res: any) => {
    db.prepare("DELETE FROM berita_acara WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  }));

  // Voucher Requests
  router.get("/voucher-requests", asyncHandler(async (req: any, res: any) => {
    const requests = db.prepare("SELECT * FROM voucher_requests ORDER BY created_at DESC").all();
    res.json(requests);
  }));

  router.post("/voucher-requests", asyncHandler(async (req: any, res: any) => {
    const { requester_name, department, deadline, theme, slogan, validity_date, qty, created_by, voucher_value } = req.body;
    db.prepare("INSERT INTO voucher_requests (requester_name, department, deadline, theme, slogan, validity_date, qty, status, created_by, voucher_value) VALUES (?, ?, ?, ?, ?, ?, ?, 'Baru Diminta', ?, ?)").run(
      requester_name,
      department,
      deadline,
      theme,
      slogan || '',
      validity_date,
      parseInt(qty as string) || 0,
      created_by || 'Umum',
      voucher_value || ''
    );
    emitUpdate();
    res.json({ success: true });
  }));

  router.put("/voucher-requests/:id/status", asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const { status } = req.body;
    db.prepare("UPDATE voucher_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(
      status,
      id
    );
    emitUpdate();
    res.json({ success: true });
  }));

  router.put("/voucher-requests/:id/design", asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const { design_data, status } = req.body;
    if (design_data !== undefined && status !== undefined) {
      db.prepare("UPDATE voucher_requests SET design_data = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(
        design_data,
        status,
        id
      );
    } else if (design_data !== undefined) {
      db.prepare("UPDATE voucher_requests SET design_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(
        design_data,
        id
      );
    }
    emitUpdate();
    res.json({ success: true });
  }));

  router.delete("/voucher-requests/:id", asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    db.prepare("DELETE FROM voucher_requests WHERE id = ?").run(id);
    emitUpdate();
    res.json({ success: true });
  }));

  return router;
}
