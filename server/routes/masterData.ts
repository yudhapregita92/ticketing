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
  const { name } = req.body;
  db.prepare("INSERT INTO it_personnel (name) VALUES (?)").run(name);
  emitUpdate();
  res.json({ success: true });
}));

router.put("/it-personnel/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  db.prepare("UPDATE it_personnel SET name = ? WHERE id = ?").run(name, id);
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
  const { name, assigned_to } = req.body;
  db.prepare("INSERT INTO categories (name, assigned_to) VALUES (?, ?)").run(name, assigned_to || null);
  emitUpdate();
  res.json({ success: true });
}));

router.put("/categories/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, assigned_to } = req.body;
  db.prepare("UPDATE categories SET name = ?, assigned_to = ? WHERE id = ?").run(name, assigned_to || null, id);
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
  const { full_name, department, phone, employee_index, email, jenis_piranti, kode_piranti } = req.body;
  const normalizedPiranti = normalizeJenisPiranti(jenis_piranti);
  db.prepare("INSERT INTO master_users (full_name, department, phone, employee_index, email, jenis_piranti, kode_piranti) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    full_name ? String(full_name).trim() : '',
    department ? String(department).trim() : '-',
    phone ? String(phone).trim() : '-',
    employee_index ? String(employee_index).trim() : '-',
    email ? String(email).trim() : '-',
    normalizedPiranti,
    kode_piranti ? String(kode_piranti).trim() : '-'
  );
  emitUpdate();
  res.json({ success: true });
 }));
 
 router.put("/master-users/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { full_name, department, phone, employee_index, email, jenis_piranti, kode_piranti } = req.body;
  const normalizedPiranti = normalizeJenisPiranti(jenis_piranti);
  db.prepare("UPDATE master_users SET full_name = ?, department = ?, phone = ?, employee_index = ?, email = ?, jenis_piranti = ?, kode_piranti = ? WHERE id = ?").run(
    full_name ? String(full_name).trim() : '',
    department ? String(department).trim() : '-',
    phone ? String(phone).trim() : '-',
    employee_index ? String(employee_index).trim() : '-',
    email ? String(email).trim() : '-',
    normalizedPiranti,
    kode_piranti ? String(kode_piranti).trim() : '-',
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
   
   const insert = db.prepare("INSERT OR REPLACE INTO master_users (full_name, department, phone, employee_index, email, jenis_piranti, kode_piranti) VALUES (?, ?, ?, ?, ?, ?, ?)");
   
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
       const fullName = findValue(row, ['Nama', 'Nama Lengkap', 'full_name', 'name', 'Nama User']);
       const department = findValue(row, ['Bagian', 'Departemen', 'department', 'dept', 'Unit', 'Bagian / Departemen']);
       const phone = findValue(row, ['No HP', 'Telepon', 'phone', 'no_hp', 'No Telepon', 'Handphone']);
       const employeeIndex = findValue(row, ['Indek', 'Indeks', 'Index', 'employee_index', 'NIK', 'Indek Karyawan']);
       const email = findValue(row, ['Email', 'email', 'Alamat Email']);
       const jenisPirantiRaw = findValue(row, ['Jenis Piranti', 'jenis_piranti', 'Piranti', 'Device Type', 'Jenis Device', 'Device']);
       const kodePirantiRaw = findValue(row, ['Kode Piranti', 'kode_piranti', 'Device Code', 'Kode Device', 'Kode']);
       
       const normalizedPiranti = normalizeJenisPiranti(jenisPirantiRaw);
       
       if (fullName) {
         insert.run(
           String(fullName).trim(), 
           department ? String(department).trim() : '-', 
           phone ? String(phone).trim() : '-', 
           employeeIndex ? String(employeeIndex).trim() : '-', 
           email ? String(email).trim() : '-', 
           normalizedPiranti,
           kodePirantiRaw ? String(kodePirantiRaw).trim() : '-'
         );
         count++;
       }
     }
   })();
  
  emitUpdate();
  res.json({ success: true, count });
}));

  return router;
}
