import { Router } from "express";
import db from "../db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/errors.js";

const router = Router();

router.get("/", asyncHandler(async (req, res) => {
  const assets = db.prepare("SELECT * FROM assets ORDER BY created_at DESC").all();
  res.json(assets);
}));

router.post("/", asyncHandler(async (req, res) => {
  const { asset_id, name, category, status, assigned_to, department, purchase_date, condition, notes } = req.body;
  if (!asset_id || !name || !category) {
    throw new AppError("Missing required fields", 400);
  }
  const info = db.prepare(
    "INSERT INTO assets (asset_id, name, category, status, assigned_to, department, purchase_date, condition, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(asset_id, name, category, status || 'Active', assigned_to || null, department || null, purchase_date || null, condition || null, notes || null);
  
  const newAsset = db.prepare("SELECT * FROM assets WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(newAsset);
}));

router.put("/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { asset_id, name, category, status, assigned_to, department, purchase_date, condition, notes } = req.body;
  db.prepare(
    "UPDATE assets SET asset_id = ?, name = ?, category = ?, status = ?, assigned_to = ?, department = ?, purchase_date = ?, condition = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).run(asset_id, name, category, status, assigned_to, department, purchase_date, condition, notes, id);
  res.json({ success: true });
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM assets WHERE id = ?").run(id);
  res.json({ success: true });
}));

export default router;
