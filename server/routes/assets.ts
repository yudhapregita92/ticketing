import express from "express";
import db from "../db.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { AppError } from "../utils/errors.ts";

const router = express.Router();

router.get("/", asyncHandler(async (req, res) => {
  const assets = db.prepare("SELECT * FROM assets ORDER BY created_at DESC").all();
  res.json(assets);
}));

router.post("/", asyncHandler(async (req, res) => {
  const { 
    asset_id, name, category, status, assigned_to, department, purchase_date, condition, notes,
    device_code, brand, specs, serial_number, usage_status, user_index, budget_type 
  } = req.body;

  if (!asset_id || !name || !category) {
    throw new AppError("Missing required fields", 400);
  }

  const info = db.prepare(
    `INSERT INTO assets (
      asset_id, name, category, status, assigned_to, department, purchase_date, condition, notes,
      device_code, brand, specs, serial_number, usage_status, user_index, budget_type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    asset_id, name, category, status || 'Active', assigned_to || null, department || null, 
    purchase_date || null, condition || null, notes || null,
    device_code || null, brand || null, specs || null, serial_number || null, usage_status || null,
    user_index || null, budget_type || 'Capex'
  );
  
  const newAsset = db.prepare("SELECT * FROM assets WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(newAsset);
}));

router.put("/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    asset_id, name, category, status, assigned_to, department, purchase_date, condition, notes,
    device_code, brand, specs, serial_number, usage_status, user_index, budget_type 
  } = req.body;

  db.prepare(
    `UPDATE assets SET 
      asset_id = ?, name = ?, category = ?, status = ?, assigned_to = ?, department = ?, 
      purchase_date = ?, condition = ?, notes = ?, updated_at = CURRENT_TIMESTAMP,
      device_code = ?, brand = ?, specs = ?, serial_number = ?, usage_status = ?, user_index = ?,
      budget_type = ?
    WHERE id = ?`
  ).run(
    asset_id, name, category, status, assigned_to, department, 
    purchase_date, condition, notes,
    device_code, brand, specs, serial_number, usage_status, user_index || null,
    budget_type || 'Capex',
    id
  );
  res.json({ success: true });
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM assets WHERE id = ?").run(id);
  res.json({ success: true });
}));

router.post("/delete-all", asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (password !== "root") {
    throw new AppError("Password konfirmasi tidak valid (harus 'root'). Hapus seluruh data aset dibatalkan.", 401);
  }
  db.prepare("DELETE FROM assets").run();
  res.json({ success: true, message: "Seluruh data aset berhasil dihapus." });
}));

// Category Endpoints
router.get("/categories", asyncHandler(async (req, res) => {
  const categories = db.prepare("SELECT * FROM asset_categories ORDER BY name ASC").all();
  res.json(categories);
}));

router.post("/categories", asyncHandler(async (req, res) => {
  const { name, kode_kategori } = req.body;
  if (!name) throw new AppError("Name is required", 400);
  const info = db.prepare("INSERT INTO asset_categories (name, kode_kategori) VALUES (?, ?)").run(name, kode_kategori || null);
  res.status(201).json({ id: info.lastInsertRowid, name, kode_kategori });
}));

router.put("/categories/:id", asyncHandler(async (req, res) => {
  const { name, kode_kategori } = req.body;
  if (!name) throw new AppError("Name is required", 400);
  db.prepare("UPDATE asset_categories SET name = ?, kode_kategori = ? WHERE id = ?").run(name, kode_kategori || null, req.params.id);
  res.json({ success: true });
}));

router.delete("/categories/:id", asyncHandler(async (req, res) => {
  db.prepare("DELETE FROM asset_categories WHERE id = ?").run(req.params.id);
  res.json({ success: true });
}));

// Borrowed Assets Endpoints
router.get("/borrowed", asyncHandler(async (req, res) => {
  const borrowed = db.prepare("SELECT * FROM borrowed_assets ORDER BY created_at DESC").all();
  res.json(borrowed);
}));

router.post("/borrowed", asyncHandler(async (req, res) => {
  const { 
    asset_id, device_name, device_code, budget_type, borrower_name, 
    borrower_department, borrow_date, expected_return_date, notes, signature 
  } = req.body;

  if (!device_name || !borrower_name || !borrow_date) {
    throw new AppError("Nama perangkat, nama peminjam, dan tanggal pinjam wajib diisi", 400);
  }

  const info = db.prepare(
    `INSERT INTO borrowed_assets (
      asset_id, device_name, device_code, budget_type, borrower_name,
      borrower_department, borrow_date, expected_return_date, notes, signature, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Dipinjam')`
  ).run(
    asset_id || null, device_name, device_code || null, budget_type || 'Capex', borrower_name,
    borrower_department || null, borrow_date, expected_return_date || null, notes || null, signature || null
  );

  // If asset_id or device_code is linked, update main asset status to 'In Use' or 'Dipinjam'
  if (asset_id) {
    db.prepare("UPDATE assets SET status = 'In Repair', notes = ? WHERE id = ?").run(`Dipinjam oleh ${borrower_name}`, asset_id);
  } else if (device_code) {
    db.prepare("UPDATE assets SET status = 'In Repair', notes = ? WHERE device_code = ?").run(`Dipinjam oleh ${borrower_name}`, device_code);
  }

  const newRecord = db.prepare("SELECT * FROM borrowed_assets WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(newRecord);
}));

router.put("/borrowed/:id/return", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { return_date, received_by } = req.body;
  const actualReturnDate = return_date || new Date().toISOString().split('T')[0];
  const receiver = received_by || 'IT Staff';

  const record = db.prepare("SELECT * FROM borrowed_assets WHERE id = ?").get(id) as any;
  if (!record) throw new AppError("Data peminjaman tidak ditemukan", 404);

  db.prepare(
    "UPDATE borrowed_assets SET status = 'Dikembalikan', actual_return_date = ?, received_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).run(actualReturnDate, receiver, id);

  // Revert asset status back to 'Active'
  if (record.asset_id) {
    db.prepare("UPDATE assets SET status = 'Active', notes = ? WHERE id = ?").run(`Dikembalikan oleh ${record.borrower_name} (Diterima oleh ${receiver})`, record.asset_id);
  } else if (record.device_code) {
    db.prepare("UPDATE assets SET status = 'Active', notes = ? WHERE device_code = ?").run(`Dikembalikan oleh ${record.borrower_name} (Diterima oleh ${receiver})`, record.device_code);
  }

  res.json({ success: true, message: "Perangkat berhasil dikembalikan" });
}));

router.delete("/borrowed/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM borrowed_assets WHERE id = ?").run(id);
  res.json({ success: true });
}));

export default router;
