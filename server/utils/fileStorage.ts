import fs from "fs";
import path from "path";
import db from "../db.ts";

export interface SaveMediaOptions {
  entityType: 'member_photo' | 'journal_signature' | 'ticket_photo' | 'ticket_face_photo';
  identifier?: string;
  name?: string;
}

/**
 * Gets the configured absolute path where uploads are stored on disk.
 */
export function getUploadsDirectory(): string {
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'file_storage_path'").get() as { value: string } | undefined;
    const customPath = row?.value ? row.value.trim() : '';
    if (customPath) {
      return path.isAbsolute(customPath) ? customPath : path.resolve(process.cwd(), customPath);
    }
  } catch (e) {
    console.error("Error reading file_storage_path setting:", e);
  }
  return path.resolve(process.cwd(), 'uploads');
}

/**
 * Gets the configured storage mode: 'db' (Base64) or 'local' (Disk File).
 */
export function getStorageMode(): 'db' | 'local' {
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'file_storage_mode'").get() as { value: string } | undefined;
    if (row?.value === 'local' || row?.value === 'disk') {
      return 'local';
    }
  } catch (e) {
    console.error("Error reading file_storage_mode setting:", e);
  }
  return 'db';
}

/**
 * Saves a base64 media string to disk if local storage mode is active,
 * or returns it as-is if DB mode is active or if saving fails.
 */
export function saveMediaFile(base64OrPath: string | null | undefined, options: SaveMediaOptions): string | null {
  if (!base64OrPath || typeof base64OrPath !== 'string') return null;

  // If it's already a URL or local file path, return as is
  if (!base64OrPath.startsWith('data:image/')) {
    return base64OrPath;
  }

  const mode = getStorageMode();
  if (mode !== 'local') {
    return base64OrPath; // Keep in DB as base64
  }

  try {
    const matches = base64OrPath.match(/^data:image\/([a-zA-Z0-9-+.]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return base64OrPath;
    }

    let ext = matches[1].toLowerCase();
    if (ext === 'jpeg') ext = 'jpg';
    if (ext === 'svg+xml') ext = 'svg';

    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Format subfolder
    let subfolder = 'others';
    if (options.entityType === 'member_photo') subfolder = 'members';
    else if (options.entityType === 'journal_signature') subfolder = 'journals';
    else if (options.entityType === 'ticket_photo' || options.entityType === 'ticket_face_photo') subfolder = 'tickets';

    const targetDir = path.join(getUploadsDirectory(), subfolder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Clean name and identifier for safe filename
    const cleanName = (options.name || '').trim().replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/_+/g, '_').substring(0, 30);
    const cleanId = (options.identifier || '').trim().replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/_+/g, '_').substring(0, 20);
    const randSuffix = Math.floor(1000 + Math.random() * 9000);

    let filename = '';
    if (options.entityType === 'member_photo') {
      const parts = ['foto', cleanName, cleanId, `${Date.now()}_${randSuffix}`].filter(Boolean);
      filename = `${parts.join('_')}.${ext}`;
    } else if (options.entityType === 'journal_signature') {
      const parts = ['ttd', cleanName, cleanId, `${Date.now()}_${randSuffix}`].filter(Boolean);
      filename = `${parts.join('_')}.png`;
    } else if (options.entityType === 'ticket_face_photo') {
      const parts = ['tiket_face', cleanId || cleanName, `${Date.now()}_${randSuffix}`].filter(Boolean);
      filename = `${parts.join('_')}.${ext}`;
    } else { // ticket_photo
      const parts = ['tiket', cleanId || cleanName, `${Date.now()}_${randSuffix}`].filter(Boolean);
      filename = `${parts.join('_')}.${ext}`;
    }

    const fullFilePath = path.join(targetDir, filename);
    fs.writeFileSync(fullFilePath, buffer);

    // Return virtual URL path for express static handler
    return `/uploads/${subfolder}/${filename}`;
  } catch (err) {
    console.error('[FileStorage] Error saving file to disk, falling back to base64:', err);
    return base64OrPath; // Fallback to base64 on disk write error
  }
}

/**
 * Migrates existing Base64 records in the database to local disk files,
 * or converts local disk files back to Base64 in DB.
 */
export function migrateMediaStorage(targetMode: 'local' | 'db'): { success: boolean, convertedCount: number, errorCount: number, message: string } {
  let convertedCount = 0;
  let errorCount = 0;

  try {
    const baseDir = getUploadsDirectory();

    if (targetMode === 'local') {
      // 1. Memberships
      const members = db.prepare("SELECT id, nama, kode_lokal, foto FROM memberships WHERE foto LIKE 'data:image%'").all() as any[];
      for (const m of members) {
        try {
          const newPath = saveMediaFile(m.foto, { entityType: 'member_photo', identifier: m.kode_lokal || String(m.id), name: m.nama });
          if (newPath && newPath !== m.foto) {
            db.prepare("UPDATE memberships SET foto = ? WHERE id = ?").run(newPath, m.id);
            convertedCount++;
          }
        } catch (e) {
          errorCount++;
        }
      }

      // 2. Journals
      const journals = db.prepare("SELECT id, nama, kode_lokal, signature FROM membership_journals WHERE signature LIKE 'data:image%'").all() as any[];
      for (const j of journals) {
        try {
          const newPath = saveMediaFile(j.signature, { entityType: 'journal_signature', identifier: j.kode_lokal || String(j.id), name: j.nama });
          if (newPath && newPath !== j.signature) {
            db.prepare("UPDATE membership_journals SET signature = ? WHERE id = ?").run(newPath, j.id);
            convertedCount++;
          }
        } catch (e) {
          errorCount++;
        }
      }

      // 3. Tickets
      const tickets = db.prepare("SELECT id, ticket_no, name, photo, face_photo FROM tickets WHERE photo LIKE 'data:image%' OR face_photo LIKE 'data:image%'").all() as any[];
      for (const t of tickets) {
        try {
          let updatedPhoto = t.photo;
          let updatedFacePhoto = t.face_photo;

          if (t.photo && t.photo.startsWith('data:image')) {
            updatedPhoto = saveMediaFile(t.photo, { entityType: 'ticket_photo', identifier: t.ticket_no, name: t.name });
          }
          if (t.face_photo && t.face_photo.startsWith('data:image')) {
            updatedFacePhoto = saveMediaFile(t.face_photo, { entityType: 'ticket_face_photo', identifier: t.ticket_no, name: t.name });
          }

          if (updatedPhoto !== t.photo || updatedFacePhoto !== t.face_photo) {
            db.prepare("UPDATE tickets SET photo = ?, face_photo = ? WHERE id = ?").run(updatedPhoto, updatedFacePhoto, t.id);
            convertedCount++;
          }
        } catch (e) {
          errorCount++;
        }
      }
    } else {
      // Convert local files back to Base64 in DB
      // 1. Memberships
      const members = db.prepare("SELECT id, foto FROM memberships WHERE foto LIKE '/uploads/%'").all() as any[];
      for (const m of members) {
        try {
          const relPath = m.foto.replace(/^\/uploads\//, '');
          const absPath = path.join(baseDir, relPath);
          if (fs.existsSync(absPath)) {
            const buf = fs.readFileSync(absPath);
            const ext = path.extname(absPath).replace('.', '') || 'jpg';
            const base64 = `data:image/${ext};base64,${buf.toString('base64')}`;
            db.prepare("UPDATE memberships SET foto = ? WHERE id = ?").run(base64, m.id);
            convertedCount++;
          }
        } catch (e) {
          errorCount++;
        }
      }

      // 2. Journals
      const journals = db.prepare("SELECT id, signature FROM membership_journals WHERE signature LIKE '/uploads/%'").all() as any[];
      for (const j of journals) {
        try {
          const relPath = j.signature.replace(/^\/uploads\//, '');
          const absPath = path.join(baseDir, relPath);
          if (fs.existsSync(absPath)) {
            const buf = fs.readFileSync(absPath);
            const base64 = `data:image/png;base64,${buf.toString('base64')}`;
            db.prepare("UPDATE membership_journals SET signature = ? WHERE id = ?").run(base64, j.id);
            convertedCount++;
          }
        } catch (e) {
          errorCount++;
        }
      }

      // 3. Tickets
      const tickets = db.prepare("SELECT id, photo, face_photo FROM tickets WHERE photo LIKE '/uploads/%' OR face_photo LIKE '/uploads/%'").all() as any[];
      for (const t of tickets) {
        try {
          let updatedPhoto = t.photo;
          let updatedFacePhoto = t.face_photo;

          if (t.photo && t.photo.startsWith('/uploads/')) {
            const relPath = t.photo.replace(/^\/uploads\//, '');
            const absPath = path.join(baseDir, relPath);
            if (fs.existsSync(absPath)) {
              const buf = fs.readFileSync(absPath);
              const ext = path.extname(absPath).replace('.', '') || 'jpg';
              updatedPhoto = `data:image/${ext};base64,${buf.toString('base64')}`;
            }
          }

          if (t.face_photo && t.face_photo.startsWith('/uploads/')) {
            const relPath = t.face_photo.replace(/^\/uploads\//, '');
            const absPath = path.join(baseDir, relPath);
            if (fs.existsSync(absPath)) {
              const buf = fs.readFileSync(absPath);
              const ext = path.extname(absPath).replace('.', '') || 'jpg';
              updatedFacePhoto = `data:image/${ext};base64,${buf.toString('base64')}`;
            }
          }

          if (updatedPhoto !== t.photo || updatedFacePhoto !== t.face_photo) {
            db.prepare("UPDATE tickets SET photo = ?, face_photo = ? WHERE id = ?").run(updatedPhoto, updatedFacePhoto, t.id);
            convertedCount++;
          }
        } catch (e) {
          errorCount++;
        }
      }
    }

    return {
      success: true,
      convertedCount,
      errorCount,
      message: `Berhasil mengkonversi ${convertedCount} file media (${errorCount} gagal).`
    };
  } catch (err: any) {
    return {
      success: false,
      convertedCount,
      errorCount,
      message: `Terjadi kesalahan saat migrasi: ${err.message}`
    };
  }
}
