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
    device_code, brand, specs, serial_number, usage_status, user_index 
  } = req.body;

  if (!asset_id || !name || !category) {
    throw new AppError("Missing required fields", 400);
  }

  const info = db.prepare(
    `INSERT INTO assets (
      asset_id, name, category, status, assigned_to, department, purchase_date, condition, notes,
      device_code, brand, specs, serial_number, usage_status, user_index
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    asset_id, name, category, status || 'Active', assigned_to || null, department || null, 
    purchase_date || null, condition || null, notes || null,
    device_code || null, brand || null, specs || null, serial_number || null, usage_status || null,
    user_index || null
  );
  
  const newAsset = db.prepare("SELECT * FROM assets WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(newAsset);
}));

router.put("/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    asset_id, name, category, status, assigned_to, department, purchase_date, condition, notes,
    device_code, brand, specs, serial_number, usage_status, user_index 
  } = req.body;

  db.prepare(
    `UPDATE assets SET 
      asset_id = ?, name = ?, category = ?, status = ?, assigned_to = ?, department = ?, 
      purchase_date = ?, condition = ?, notes = ?, updated_at = CURRENT_TIMESTAMP,
      device_code = ?, brand = ?, specs = ?, serial_number = ?, usage_status = ?, user_index = ?
    WHERE id = ?`
  ).run(
    asset_id, name, category, status, assigned_to, department, 
    purchase_date, condition, notes,
    device_code, brand, specs, serial_number, usage_status, user_index || null,
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

export default router;
