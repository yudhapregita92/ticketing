import express from "express";
import multer from "multer";
import xlsx from "xlsx";
import db from "../db.ts";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", (req, res) => {
  try {
    const memberships = db.prepare("SELECT * FROM memberships ORDER BY created_at DESC").all();
    res.json(memberships);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id/logs", (req, res) => {
  try {
    const logs = db.prepare("SELECT * FROM membership_logs WHERE membership_id = ? ORDER BY created_at DESC").all(req.params.id);
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", (req, res) => {
  const { kode_lokal, indek_kdk, indek_ggf, nama, bagian, barcode, foto, nik_ktp, no_hp, photo_scale, photo_offset_x, photo_offset_y, keterangan_update } = req.body;
  try {
    const info = db.prepare(
      "INSERT INTO memberships (kode_lokal, indek_kdk, indek_ggf, nama, bagian, barcode, foto, nik_ktp, no_hp, photo_scale, photo_offset_x, photo_offset_y) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(kode_lokal || null, indek_kdk || null, indek_ggf || null, nama, bagian || null, barcode || null, foto || null, nik_ktp || null, no_hp || null, photo_scale !== undefined ? photo_scale : 1.0, photo_offset_x !== undefined ? photo_offset_x : 50.0, photo_offset_y !== undefined ? photo_offset_y : 50.0);
    
    const newId = info.lastInsertRowid;
    
    if (keterangan_update) {
      db.prepare("INSERT INTO membership_logs (membership_id, keterangan) VALUES (?, ?)").run(newId, keterangan_update);
    }
    
    const newMembership = db.prepare("SELECT * FROM memberships WHERE id = ?").get(newId);
    res.json({ success: true, data: newMembership });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { kode_lokal, indek_kdk, indek_ggf, nama, bagian, barcode, foto, nik_ktp, no_hp, photo_scale, photo_offset_x, photo_offset_y, keterangan_update } = req.body;
  try {
    db.prepare(
      "UPDATE memberships SET kode_lokal = ?, indek_kdk = ?, indek_ggf = ?, nama = ?, bagian = ?, barcode = ?, foto = ?, nik_ktp = ?, no_hp = ?, photo_scale = ?, photo_offset_x = ?, photo_offset_y = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(kode_lokal || null, indek_kdk || null, indek_ggf || null, nama, bagian || null, barcode || null, foto || null, nik_ktp || null, no_hp || null, photo_scale !== undefined ? photo_scale : 1.0, photo_offset_x !== undefined ? photo_offset_x : 50.0, photo_offset_y !== undefined ? photo_offset_y : 50.0, id);
    
    if (keterangan_update) {
      db.prepare("INSERT INTO membership_logs (membership_id, keterangan) VALUES (?, ?)").run(id, keterangan_update);
    }
    
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

router.post("/upload", upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  
  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    
    const insert = db.prepare("INSERT INTO memberships (kode_lokal, indek_kdk, indek_ggf, nama, bagian, barcode, foto, nik_ktp, no_hp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    const update = db.prepare("UPDATE memberships SET kode_lokal = ?, indek_kdk = ?, indek_ggf = ?, nama = ?, bagian = ?, barcode = ?, foto = ?, nik_ktp = ?, no_hp = ? WHERE barcode = ?");
    
    let count = 0;
    
    const findValue = (row: any, possibleHeaders: string[]) => {
      const keys = Object.keys(row);
      const matchedKey = keys.find(k => {
        const normKey = k.trim().toLowerCase().replace(/[\s_-]+/g, '');
        return possibleHeaders.some(h => h.trim().toLowerCase().replace(/[\s_-]+/g, '') === normKey);
      });
      return matchedKey ? String(row[matchedKey]) : null;
    };

    for (const row of data as any[]) {
      const kode_lokal = findValue(row, ['kodelokal', 'kode']);
      const indek_kdk = findValue(row, ['indekkdk']);
      const indek_ggf = findValue(row, ['indekggf']);
      const nama = findValue(row, ['nama', 'name', 'namalengkap']);
      const bagian = findValue(row, ['bagian', 'department']);
      const barcode = findValue(row, ['barcode', 'kodebarcode']);
      const nik_ktp = findValue(row, ['nik', 'nikktp', 'ktp']);
      const no_hp = findValue(row, ['nohp', 'hp', 'phone', 'telepon']);
      
      if (!nama) continue; // Nama is required
      
      if (barcode) {
        const existing = db.prepare("SELECT * FROM memberships WHERE barcode = ?").get(barcode);
        if (existing) {
          update.run(kode_lokal, indek_kdk, indek_ggf, nama, bagian, barcode, null, nik_ktp, no_hp, barcode);
          count++;
          continue;
        }
      }
      
      insert.run(kode_lokal, indek_kdk, indek_ggf, nama, bagian, barcode, null, nik_ktp, no_hp);
      count++;
    }
    
    res.json({ success: true, count });
  } catch (err: any) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
