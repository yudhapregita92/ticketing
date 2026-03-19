import { Router } from "express";
import db from "../db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/errors.js";

const router = Router();

router.get("/", asyncHandler(async (req, res) => {
  const images = db.prepare(`
    SELECT id, ticket_no, name, created_at, 
           CASE WHEN photo IS NOT NULL AND photo != '' THEN 1 ELSE 0 END as has_photo,
           CASE WHEN face_photo IS NOT NULL AND face_photo != '' THEN 1 ELSE 0 END as has_face_photo
    FROM tickets 
    WHERE (photo IS NOT NULL AND photo != '') OR (face_photo IS NOT NULL AND face_photo != '')
    ORDER BY created_at DESC
  `).all();
  res.json(images);
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { type } = req.query; // 'photo' or 'face_photo' or 'both'
  
  if (type === 'photo') {
    db.prepare("UPDATE tickets SET photo = NULL WHERE id = ?").run(id);
  } else if (type === 'face_photo') {
    db.prepare("UPDATE tickets SET face_photo = NULL WHERE id = ?").run(id);
  } else {
    db.prepare("UPDATE tickets SET photo = NULL, face_photo = NULL WHERE id = ?").run(id);
  }
  
  res.json({ success: true });
}));

router.post("/cleanup", asyncHandler(async (req, res) => {
  const durationSetting = db.prepare("SELECT value FROM settings WHERE key = 'photo_cleanup_duration'").get() as { value: string } | undefined;
  const hours = parseInt(durationSetting?.value || '24');
  
  const result = db.prepare(`
    UPDATE tickets 
    SET photo = NULL, face_photo = NULL
    WHERE ((photo IS NOT NULL AND photo != '') OR (face_photo IS NOT NULL AND face_photo != ''))
    AND created_at <= datetime('now', ? || ' hours')
  `).run(`-${hours}`);
  
  try {
    db.exec("VACUUM");
  } catch (e) {
    console.error("Vacuum failed:", e);
  }
  
  res.json({ success: true, count: result.changes });
}));

export default router;
