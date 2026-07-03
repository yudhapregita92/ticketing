import express from "express";
import db from "../db.ts";

const router = express.Router();

router.get("/", (req, res) => {
  try {
    const memberships = db.prepare("SELECT * FROM memberships ORDER BY created_at DESC").all();
    res.json(memberships);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", (req, res) => {
  const { kode_lokal, indek_kdk, indek_ggf, nama, bagian, barcode, foto } = req.body;
  try {
    const info = db.prepare(
      "INSERT INTO memberships (kode_lokal, indek_kdk, indek_ggf, nama, bagian, barcode, foto) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(kode_lokal || null, indek_kdk || null, indek_ggf || null, nama, bagian || null, barcode || null, foto || null);
    
    const newMembership = db.prepare("SELECT * FROM memberships WHERE id = ?").get(info.lastInsertRowid);
    res.json({ success: true, data: newMembership });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { kode_lokal, indek_kdk, indek_ggf, nama, bagian, barcode, foto } = req.body;
  try {
    db.prepare(
      "UPDATE memberships SET kode_lokal = ?, indek_kdk = ?, indek_ggf = ?, nama = ?, bagian = ?, barcode = ?, foto = ? WHERE id = ?"
    ).run(kode_lokal || null, indek_kdk || null, indek_ggf || null, nama, bagian || null, barcode || null, foto || null, id);
    
    const updated = db.prepare("SELECT * FROM memberships WHERE id = ?").get(id);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  try {
    db.prepare("DELETE FROM memberships WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
