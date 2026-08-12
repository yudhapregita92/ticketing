import express from "express";
import db from "../db.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";
import type { User } from "../types.ts";
import { AppError } from "../utils/errors.ts";
import bcrypt from "bcryptjs";

const router = express.Router();

router.post("/login", asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const cleanUsername = String(username || '').trim();
  const cleanPassword = String(password || '').trim();
  
  console.log(`Login attempt for: ${cleanUsername}`);
  
  const user = db.prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(?)").get(cleanUsername) as User | undefined;
  
  if (user) {
    const isMatch = await bcrypt.compare(cleanPassword, user.password || '');
    
    if (isMatch) {
      console.log(`Login success for: ${user.username}, Role: ${user.role}`);
      res.json({ 
        success: true, 
        user: { 
          username: user.username, 
          role: user.role, 
          full_name: user.full_name,
          theme_mode: user.theme_mode,
          primary_color: user.primary_color,
          is_on_duty: user.is_on_duty !== undefined ? user.is_on_duty : 1
        } 
      });
      return;
    }
  }
  
  console.log(`Login failed for: ${cleanUsername}`);
  throw new AppError("Username atau Password salah", 401);
}));

router.get("/admin-users", asyncHandler(async (req, res) => {
  const users = db.prepare("SELECT id, username, full_name, role, is_on_duty, phone FROM users ORDER BY id ASC").all() as User[];
  res.json(users);
}));

router.post("/admin-users", asyncHandler(async (req, res) => {
  const { username, password, full_name, role, phone } = req.body;
  if (!username || !password || !role) {
    throw new AppError("Missing required fields", 400);
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  db.prepare("INSERT INTO users (username, password, full_name, role, phone) VALUES (?, ?, ?, ?, ?)").run(username, hashedPassword, full_name, role, phone || null);
  res.json({ success: true });
}));

router.put("/admin-users/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { username, password, full_name, role, phone } = req.body;
  
  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.prepare("UPDATE users SET username = ?, password = ?, full_name = ?, role = ?, phone = ? WHERE id = ?").run(username, hashedPassword, full_name, role, phone || null, id);
  } else {
    db.prepare("UPDATE users SET username = ?, full_name = ?, role = ?, phone = ? WHERE id = ?").run(username, full_name, role, phone || null, id);
  }
  res.json({ success: true });
}));

router.delete("/admin-users/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM users WHERE id = ?").run(id);
  res.json({ success: true });
}));

router.post("/change-password", asyncHandler(async (req, res) => {
  const { username, newPassword, currentPassword, user_id } = req.body;
  
  if (user_id) {
    // Changing password for master_user (staff)
    const masterUser = db.prepare("SELECT * FROM master_users WHERE id = ?").get(user_id) as any;
    if (!masterUser) {
      throw new AppError("User tidak ditemukan", 404);
    }
    
    if (!currentPassword || !newPassword) {
      throw new AppError("Password lama dan Password baru wajib diisi", 400);
    }
    
    const cleanCurrent = String(currentPassword).trim();
    const cleanNew = String(newPassword).trim();
    
    if (cleanNew.length < 3) {
      throw new AppError("Password baru minimal 3 karakter", 400);
    }
    
    const storedPass = masterUser.custom_password;
    let isValid = false;
    
    if (storedPass) {
      if (storedPass.startsWith("$2a$") || storedPass.startsWith("$2b$")) {
        isValid = await bcrypt.compare(cleanCurrent, storedPass);
      } else {
        isValid = (storedPass === cleanCurrent);
      }
    } else {
      isValid = (masterUser.employee_index && String(masterUser.employee_index).trim() === cleanCurrent);
    }
    
    if (!isValid) {
      throw new AppError("Password lama yang Anda masukkan salah", 400);
    }
    
    const hashedPassword = await bcrypt.hash(cleanNew, 10);
    db.prepare("UPDATE master_users SET custom_password = ? WHERE id = ?").run(hashedPassword, user_id);
    
    res.json({ success: true, message: "Password berhasil diubah" });
    return;
  }

  if (!username || !newPassword) {
    throw new AppError("Username dan Password baru wajib diisi", 400);
  }

  const user = db.prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(?)").get(username.trim()) as User | undefined;
  if (!user) {
    throw new AppError("User tidak ditemukan", 404);
  }

  if (currentPassword) {
    const isMatch = await bcrypt.compare(String(currentPassword).trim(), user.password || '');
    if (!isMatch) {
      throw new AppError("Password lama yang Anda masukkan salah", 400);
    }
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  db.prepare("UPDATE users SET password = ? WHERE LOWER(username) = LOWER(?)").run(hashedPassword, username.trim().toLowerCase());
  
  res.json({ success: true, message: "Password berhasil diubah" });
}));

// Validate login password for master_users
router.post("/verify-user-login", asyncHandler(async (req, res) => {
  const { user_id, password } = req.body;
  if (!user_id || !password) {
    throw new AppError("User dan Password / Index wajib diisi", 400);
  }
  
  const user = db.prepare("SELECT * FROM master_users WHERE id = ?").get(user_id) as any;
  if (!user) {
    throw new AppError("User tidak ditemukan", 404);
  }

  const cleanInput = String(password).trim();
  const storedPass = user.custom_password;

  let isValid = false;
  if (storedPass) {
    if (storedPass.startsWith("$2a$") || storedPass.startsWith("$2b$")) {
      isValid = await bcrypt.compare(cleanInput, storedPass);
    } else {
      isValid = (storedPass === cleanInput);
    }
  } else {
    isValid = (user.employee_index && String(user.employee_index).trim() === cleanInput);
  }

  if (!isValid) {
    throw new AppError("Password / Index Karyawan yang Anda masukkan salah", 401);
  }

  res.json({ success: true, user });
}));

// Reset password for master_users back to NIK / employee_index
router.post("/master-users/:id/reset-password", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = db.prepare("SELECT * FROM master_users WHERE id = ?").get(id) as any;
  if (!user) {
    throw new AppError("User tidak ditemukan", 404);
  }

  db.prepare("UPDATE master_users SET custom_password = NULL WHERE id = ?").run(id);
  res.json({ 
    success: true, 
    message: `Password untuk ${user.full_name} berhasil di-reset kembali ke Indeks/NIK (${user.employee_index || '-'})` 
  });
}));

// Reset password for admin users back to default
router.post("/admin-users/:id/reset-password", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;
  if (!user) {
    throw new AppError("User admin tidak ditemukan", 404);
  }

  const defaultPass = user.username || "123456";
  const hashedPassword = await bcrypt.hash(defaultPass, 10);
  db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, id);

  res.json({
    success: true,
    message: `Password admin ${user.username} berhasil di-reset ke default (${defaultPass})`
  });
}));

router.get("/users", asyncHandler(async (req, res) => {
  const users = db.prepare("SELECT id, username, full_name, role, is_on_duty FROM users").all() as User[];
  res.json(users);
}));

router.post("/users/duty-status", asyncHandler(async (req, res) => {
  const { username, is_on_duty } = req.body;
  if (!username) {
    throw new AppError("Username required", 400);
  }
  const statusValue = is_on_duty ? 1 : 0;
  db.prepare("UPDATE users SET is_on_duty = ? WHERE LOWER(username) = LOWER(?)").run(statusValue, String(username).trim());
  
  res.json({ success: true, username, is_on_duty: statusValue });
}));

router.patch("/users/:username/settings", asyncHandler(async (req, res) => {
  const { username } = req.params;
  const { theme_mode, primary_color, id } = req.body;
  
  if (id) {
    db.prepare("UPDATE users SET theme_mode = ?, primary_color = ? WHERE id = ?").run(theme_mode, primary_color, id);
  } else {
    db.prepare("UPDATE users SET theme_mode = ?, primary_color = ? WHERE username = ?").run(theme_mode, primary_color, username);
  }
  res.json({ success: true });
}));

router.put("/users/:username/settings", asyncHandler(async (req, res) => {
  const { username } = req.params;
  const { theme_mode, primary_color, id } = req.body;
  
  if (id) {
    db.prepare("UPDATE users SET theme_mode = ?, primary_color = ? WHERE id = ?").run(theme_mode, primary_color, id);
  } else {
    db.prepare("UPDATE users SET theme_mode = ?, primary_color = ? WHERE username = ?").run(theme_mode, primary_color, username);
  }
  res.json({ success: true });
}));

export default router;
