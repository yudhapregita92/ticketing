import { Router } from "express";
import db from "../db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../types.js";
import { AppError } from "../utils/errors.js";
import bcrypt from "bcryptjs";

const router = Router();

router.post("/login", asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const cleanUsername = String(username || '').trim();
  const cleanPassword = String(password || '').trim();
  
  console.log(`Login attempt for: ${cleanUsername}`);
  
  const user = db.prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(?)").get(cleanUsername) as User | undefined;
  
  if (user) {
    const isMatch = await bcrypt.compare(cleanPassword, user.password);
    
    if (isMatch) {
      console.log(`Login success for: ${user.username}, Role: ${user.role}`);
      res.json({ 
        success: true, 
        user: { 
          username: user.username, 
          role: user.role, 
          full_name: user.full_name,
          theme_mode: user.theme_mode,
          primary_color: user.primary_color
        } 
      });
      return;
    }
  }
  
  console.log(`Login failed for: ${cleanUsername}`);
  throw new AppError("Username atau Password salah", 401);
}));

router.get("/admin-users", asyncHandler(async (req, res) => {
  const users = db.prepare("SELECT id, username, full_name, role FROM users ORDER BY id ASC").all() as User[];
  res.json(users);
}));

router.post("/admin-users", asyncHandler(async (req, res) => {
  const { username, password, full_name, role } = req.body;
  if (!username || !password || !role) {
    throw new AppError("Missing required fields", 400);
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  db.prepare("INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)").run(username, hashedPassword, full_name, role);
  res.json({ success: true });
}));

router.put("/admin-users/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { username, password, full_name, role } = req.body;
  
  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.prepare("UPDATE users SET username = ?, password = ?, full_name = ?, role = ? WHERE id = ?").run(username, hashedPassword, full_name, role, id);
  } else {
    db.prepare("UPDATE users SET username = ?, full_name = ?, role = ? WHERE id = ?").run(username, full_name, role, id);
  }
  res.json({ success: true });
}));

router.delete("/admin-users/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM users WHERE id = ?").run(id);
  res.json({ success: true });
}));

router.get("/users", asyncHandler(async (req, res) => {
  const users = db.prepare("SELECT id, username, full_name, role FROM users WHERE role != 'Super Admin'").all() as User[];
  res.json(users);
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
