import { Router } from "express";
import db from "../db.js";
import multer from "multer";
import * as xlsx from "xlsx";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/errors.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// IT Personnel
router.get("/it-personnel", asyncHandler(async (req, res) => {
  res.json(db.prepare("SELECT * FROM it_personnel ORDER BY name ASC").all());
}));

router.post("/it-personnel", asyncHandler(async (req, res) => {
  const { name } = req.body;
  db.prepare("INSERT INTO it_personnel (name) VALUES (?)").run(name);
  res.json({ success: true });
}));

router.put("/it-personnel/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  db.prepare("UPDATE it_personnel SET name = ? WHERE id = ?").run(name, id);
  res.json({ success: true });
}));

router.delete("/it-personnel/:id", asyncHandler(async (req, res) => {
  db.prepare("DELETE FROM it_personnel WHERE id = ?").run(req.params.id);
  res.json({ success: true });
}));

// Departments
router.get("/departments", asyncHandler(async (req, res) => {
  res.json(db.prepare("SELECT * FROM departments ORDER BY name ASC").all());
}));

router.post("/departments", asyncHandler(async (req, res) => {
  const { name } = req.body;
  db.prepare("INSERT INTO departments (name) VALUES (?)").run(name);
  res.json({ success: true });
}));

router.put("/departments/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  db.prepare("UPDATE departments SET name = ? WHERE id = ?").run(name, id);
  res.json({ success: true });
}));

router.delete("/departments/:id", asyncHandler(async (req, res) => {
  db.prepare("DELETE FROM departments WHERE id = ?").run(req.params.id);
  res.json({ success: true });
}));

// Categories
router.get("/categories", asyncHandler(async (req, res) => {
  res.json(db.prepare("SELECT * FROM categories ORDER BY name ASC").all());
}));

router.post("/categories", asyncHandler(async (req, res) => {
  const { name, assigned_to } = req.body;
  db.prepare("INSERT INTO categories (name, assigned_to) VALUES (?, ?)").run(name, assigned_to || null);
  res.json({ success: true });
}));

router.put("/categories/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, assigned_to } = req.body;
  db.prepare("UPDATE categories SET name = ?, assigned_to = ? WHERE id = ?").run(name, assigned_to || null, id);
  res.json({ success: true });
}));

router.delete("/categories/:id", asyncHandler(async (req, res) => {
  db.prepare("DELETE FROM categories WHERE id = ?").run(req.params.id);
  res.json({ success: true });
}));

// Master Users
router.get("/master-users", asyncHandler(async (req, res) => {
  res.json(db.prepare("SELECT * FROM master_users ORDER BY full_name ASC").all());
}));

router.post("/master-users", asyncHandler(async (req, res) => {
  const { full_name, department, phone, employee_index, email } = req.body;
  db.prepare("INSERT INTO master_users (full_name, department, phone, employee_index, email) VALUES (?, ?, ?, ?, ?)").run(full_name, department, phone, employee_index, email || null);
  res.json({ success: true });
}));

router.put("/master-users/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { full_name, department, phone, employee_index, email } = req.body;
  db.prepare("UPDATE master_users SET full_name = ?, department = ?, phone = ?, employee_index = ?, email = ? WHERE id = ?").run(full_name, department, phone, employee_index, email || null, id);
  res.json({ success: true });
}));

router.delete("/master-users/:id", asyncHandler(async (req, res) => {
  db.prepare("DELETE FROM master_users WHERE id = ?").run(req.params.id);
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
  
  const insert = db.prepare("INSERT OR REPLACE INTO master_users (full_name, department, phone, employee_index, email) VALUES (?, ?, ?, ?, ?)");
  
  let count = 0;
  db.transaction(() => {
    for (const row of data as any[]) {
      const fullName = row['Nama'] || row['Nama Lengkap'] || row['full_name'] || row['name'] || row['Nama User'];
      const department = row['Bagian'] || row['Departemen'] || row['department'] || row['dept'] || row['Unit'];
      const phone = row['No HP'] || row['Telepon'] || row['phone'] || row['no_hp'] || row['No Telepon'];
      const employeeIndex = row['Indek'] || row['Indeks'] || row['Index'] || row['employee_index'] || row['NIK'];
      const email = row['Email'] || row['email'] || row['Alamat Email'] || null;
      
      if (fullName && department && phone && employeeIndex) {
        insert.run(String(fullName).trim(), String(department).trim(), String(phone).trim(), String(employeeIndex).trim(), email ? String(email).trim() : null);
        count++;
      }
    }
  })();
  
  res.json({ success: true, count });
}));

export default router;
