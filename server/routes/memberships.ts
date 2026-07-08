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

router.post("/delete-all", (req, res) => {
  const { password, excludeWithPhotoAndSignature } = req.body;
  if (password !== "root") {
    return res.status(403).json({ error: "Password salah!" });
  }
  try {
    if (excludeWithPhotoAndSignature) {
      db.prepare(`
        DELETE FROM memberships 
        WHERE (foto IS NULL OR foto = '') 
          AND id NOT IN (
            SELECT DISTINCT member_id 
            FROM membership_journals 
            WHERE member_id IS NOT NULL 
              AND signature IS NOT NULL 
              AND signature != ''
          )
      `).run();
      res.json({ success: true, message: "Semua data membership berhasil dihapus (kecuali yang memiliki foto atau tanda tangan)" });
    } else {
      db.prepare("DELETE FROM memberships").run();
      res.json({ success: true, message: "Semua data membership berhasil dihapus" });
    }
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
    
    const insert = db.prepare(
      "INSERT INTO memberships (kode_lokal, indek_kdk, indek_ggf, nama, bagian, barcode, foto, nik_ktp, no_hp, photo_scale, photo_offset_x, photo_offset_y) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    const update = db.prepare(
      "UPDATE memberships SET kode_lokal = ?, indek_kdk = ?, indek_ggf = ?, nama = ?, bagian = ?, barcode = ?, foto = ?, nik_ktp = ?, no_hp = ?, photo_scale = ?, photo_offset_x = ?, photo_offset_y = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    );
    
    let count = 0;
    
    const findValue = (row: any, possibleHeaders: string[]) => {
      const keys = Object.keys(row);
      const matchedKey = keys.find(k => {
        const normKey = k.trim().toLowerCase().replace(/[\s_-]+/g, '');
        return possibleHeaders.some(h => h.trim().toLowerCase().replace(/[\s_-]+/g, '') === normKey);
      });
      return matchedKey ? String(row[matchedKey]) : null;
    };

    // First, extract and validate all rows to prevent partial imports
    const parsedRows: any[] = [];
    const fileKdkMap = new Map<string, any[]>(); // indek_kdk -> array of { nama, rowIdx }
    
    const doubleRecordsInFile: { indek_kdk: string, names: string[] }[] = [];
    const doubleRecordsWithDb: { indek_kdk: string, excelName: string, dbName: string }[] = [];

    for (let i = 0; i < data.length; i++) {
      const row: any = data[i];
      const kode_lokal = findValue(row, ['kodelokal', 'kode']);
      const indek_kdk = findValue(row, ['indekkdk']);
      const indek_ggf = findValue(row, ['indekggf']);
      const nama = findValue(row, ['nama', 'name', 'namalengkap']);
      const bagian = findValue(row, ['bagian', 'department']);
      const barcode = findValue(row, ['barcode', 'kodebarcode']);
      const nik_ktp = findValue(row, ['nik', 'nikktp', 'ktp']);
      const no_hp = findValue(row, ['nohp', 'hp', 'phone', 'telepon']);
      
      if (!nama) continue; // Skip rows without a name

      const kdkClean = indek_kdk ? indek_kdk.trim() : '';
      
      if (kdkClean) {
        if (!fileKdkMap.has(kdkClean)) {
          fileKdkMap.set(kdkClean, []);
        }
        fileKdkMap.get(kdkClean)!.push({ nama, rowIdx: i + 1 });
      }

      parsedRows.push({
        kode_lokal,
        indek_kdk: kdkClean,
        indek_ggf,
        nama,
        bagian,
        barcode,
        nik_ktp,
        no_hp
      });
    }

    // Check duplicate Indek KDK inside the Excel file
    for (const [kdk, occurrences] of fileKdkMap.entries()) {
      if (occurrences.length > 1) {
        doubleRecordsInFile.push({
          indek_kdk: kdk,
          names: occurrences.map(o => `${o.nama} (Baris ${o.rowIdx})`)
        });
      }
    }

    // Check duplicates against the database
    for (const pRow of parsedRows) {
      if (!pRow.indek_kdk) continue;

      // Find if this row matches an existing member (update path)
      let existingToUpdate: any = null;
      if (pRow.barcode) {
        existingToUpdate = db.prepare("SELECT * FROM memberships WHERE barcode = ?").get(pRow.barcode);
      }
      if (!existingToUpdate && pRow.kode_lokal) {
        existingToUpdate = db.prepare("SELECT * FROM memberships WHERE kode_lokal = ?").get(pRow.kode_lokal);
      }
      if (!existingToUpdate && pRow.nik_ktp) {
        existingToUpdate = db.prepare("SELECT * FROM memberships WHERE nik_ktp = ?").get(pRow.nik_ktp);
      }

      // Find if anyone else already has this indek_kdk
      const dbMatchWithKdk = db.prepare("SELECT * FROM memberships WHERE indek_kdk = ?").get(pRow.indek_kdk);

      if (dbMatchWithKdk) {
        if (!existingToUpdate || existingToUpdate.id !== dbMatchWithKdk.id) {
          if (!doubleRecordsWithDb.some(d => d.indek_kdk === pRow.indek_kdk)) {
            doubleRecordsWithDb.push({
              indek_kdk: pRow.indek_kdk,
              excelName: pRow.nama,
              dbName: dbMatchWithKdk.nama
            });
          }
        }
      }
    }

    // If duplicates found, reject request
    if (doubleRecordsInFile.length > 0 || doubleRecordsWithDb.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Duplikasi Indek KDK ditemukan!",
        duplicatesInFile: doubleRecordsInFile,
        duplicatesWithDb: doubleRecordsWithDb
      });
    }

    // Run actual insertions/updates
    for (const pRow of parsedRows) {
      const { kode_lokal, indek_kdk, indek_ggf, nama, bagian, barcode, nik_ktp, no_hp } = pRow;
      
      let existing: any = null;
      if (barcode) {
        existing = db.prepare("SELECT * FROM memberships WHERE barcode = ?").get(barcode);
      }
      if (!existing && kode_lokal) {
        existing = db.prepare("SELECT * FROM memberships WHERE kode_lokal = ?").get(kode_lokal);
      }
      if (!existing && nik_ktp) {
        existing = db.prepare("SELECT * FROM memberships WHERE nik_ktp = ?").get(nik_ktp);
      }
      
      if (existing) {
        // Preserve existing photo and layout/offset details
        const fotoToSave = existing.foto;
        const scaleToSave = existing.photo_scale !== null && existing.photo_scale !== undefined ? existing.photo_scale : 1.0;
        const offsetXToSave = existing.photo_offset_x !== null && existing.photo_offset_x !== undefined ? existing.photo_offset_x : 50.0;
        const offsetYToSave = existing.photo_offset_y !== null && existing.photo_offset_y !== undefined ? existing.photo_offset_y : 50.0;
        
        update.run(
          kode_lokal || existing.kode_lokal,
          indek_kdk || existing.indek_kdk,
          indek_ggf || existing.indek_ggf,
          nama,
          bagian || existing.bagian,
          barcode || existing.barcode,
          fotoToSave,
          nik_ktp || existing.nik_ktp,
          no_hp || existing.no_hp,
          scaleToSave,
          offsetXToSave,
          offsetYToSave,
          existing.id
        );
        count++;
      } else {
        insert.run(kode_lokal, indek_kdk, indek_ggf, nama, bagian, barcode, null, nik_ktp, no_hp, 1.0, 50.0, 50.0);
        count++;
      }
    }
    
    res.json({ success: true, count });
  } catch (err: any) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/journals/list", (req: any, res: any) => {
  try {
    const journals = db.prepare("SELECT * FROM membership_journals ORDER BY created_at DESC").all();
    res.json(journals);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/journals/submit", (req: any, res: any) => {
  const { member_id, nama, kode_lokal, indek_ggf, bagian, barcode, signature, keterangan } = req.body;
  if (!nama) {
    return res.status(400).json({ error: "Nama wajib diisi" });
  }
  if (!signature) {
    return res.status(400).json({ error: "Tanda tangan wajib diisi" });
  }
  try {
    const info = db.prepare(
      "INSERT INTO membership_journals (member_id, nama, kode_lokal, indek_ggf, bagian, barcode, signature, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(
      member_id || null,
      nama,
      kode_lokal || null,
      indek_ggf || null,
      bagian || null,
      barcode || null,
      signature,
      keterangan || null
    );
    
    // Also record this as a log in membership_logs if member_id exists
    if (member_id) {
      db.prepare("INSERT INTO membership_logs (membership_id, keterangan) VALUES (?, ?)").run(
        member_id,
        "Mengisi buku jurnal cetak kartu & melakukan tanda tangan digital."
      );
    }
    
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/journals/:id", (req: any, res: any) => {
  try {
    db.prepare("DELETE FROM membership_journals WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
