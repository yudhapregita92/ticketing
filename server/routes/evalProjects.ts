import express from "express";
import db from "../db.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { AppError } from "../utils/errors.ts";

const router = express.Router();

// GET all evaluation projects with a summary of their metrics
router.get("/", asyncHandler(async (req, res) => {
  const projects = db.prepare("SELECT * FROM eval_projects ORDER BY created_at DESC").all() as any[];
  
  // Enrich projects with real-time quick summary statistics
  const enriched = projects.map(p => {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as record_count,
        COUNT(DISTINCT user_name) as user_count,
        COUNT(DISTINCT department) as department_count,
        SUM(usage_count) as total_usage
      FROM eval_project_usage 
      WHERE project_id = ?
    `).get(p.id) as any;

    return {
      ...p,
      record_count: stats?.record_count || 0,
      user_count: stats?.user_count || 0,
      department_count: stats?.department_count || 0,
      total_usage: stats?.total_usage || 0
    };
  });

  res.json(enriched);
}));

// POST to create a new evaluation project
router.post("/", asyncHandler(async (req, res) => {
  const { name, description, target_users } = req.body;
  if (!name) {
    throw new AppError("Nama project wajib diisi", 400);
  }
  
  const info = db.prepare(
    "INSERT INTO eval_projects (name, description, target_users) VALUES (?, ?, ?)"
  ).run(name, description || null, Number(target_users) || 0);

  const newProject = db.prepare("SELECT * FROM eval_projects WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(newProject);
}));

// DELETE a project and its records
router.delete("/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Enable CASCADE delete if not already or manually delete usage records
  db.prepare("DELETE FROM eval_project_usage WHERE project_id = ?").run(id);
  db.prepare("DELETE FROM eval_projects WHERE id = ?").run(id);
  
  res.json({ success: true });
}));

// POST to import raw data into a project
router.post("/:id/import", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { records } = req.body;

  if (!records || !Array.isArray(records)) {
    throw new AppError("Data raw harus berupa array records", 400);
  }

  // Verify project exists
  const project = db.prepare("SELECT * FROM eval_projects WHERE id = ?").get(id);
  if (!project) {
    throw new AppError("Project tidak ditemukan", 404);
  }

  // Insert records inside an atomic fast transaction
  const insertTransaction = db.transaction((projectId: number, rows: any[]) => {
    const stmt = db.prepare(`
      INSERT INTO eval_project_usage (project_id, user_name, department, activity_date, activity_type, usage_count)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    for (const r of rows) {
      stmt.run(
        projectId,
        r.user_name || 'User Umum',
        r.department || 'Divisi Umum',
        r.activity_date || new Date().toISOString().split('T')[0],
        r.activity_type || 'Akses Aplikasi',
        Number(r.usage_count) || 1
      );
    }
  });

  insertTransaction(Number(id), records);

  res.json({ success: true, count: records.length });
}));

// POST to clear all records of a project
router.post("/:id/clear", asyncHandler(async (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM eval_project_usage WHERE project_id = ?").run(id);
  res.json({ success: true });
}));

// GET dashboard stats for a specific project
router.get("/:id/dashboard", asyncHandler(async (req, res) => {
  const { id } = req.params;

  const project = db.prepare("SELECT * FROM eval_projects WHERE id = ?").get(id) as any;
  if (!project) {
    throw new AppError("Project tidak ditemukan", 404);
  }

  // Counters
  const counters = db.prepare(`
    SELECT 
      COUNT(*) as total_records,
      COUNT(DISTINCT user_name) as active_users,
      COUNT(DISTINCT department) as active_departments,
      SUM(usage_count) as total_usage
    FROM eval_project_usage
    WHERE project_id = ?
  `).get(id) as any;

  // Trend over time (grouped by date)
  const trend = db.prepare(`
    SELECT 
      activity_date as date,
      SUM(usage_count) as count,
      COUNT(DISTINCT user_name) as active_users
    FROM eval_project_usage
    WHERE project_id = ?
    GROUP BY activity_date
    ORDER BY activity_date ASC
    LIMIT 30
  `).all(id) as any[];

  // Department distribution
  const departmentDistribution = db.prepare(`
    SELECT 
      department,
      SUM(usage_count) as count,
      COUNT(DISTINCT user_name) as users
    FROM eval_project_usage
    WHERE project_id = ?
    GROUP BY department
    ORDER BY count DESC
  `).all(id) as any[];

  // Activity type distribution
  const activityDistribution = db.prepare(`
    SELECT 
      activity_type as type,
      SUM(usage_count) as count
    FROM eval_project_usage
    WHERE project_id = ?
    GROUP BY activity_type
    ORDER BY count DESC
  `).all(id) as any[];

  // Top active users
  const topUsers = db.prepare(`
    SELECT 
      user_name,
      department,
      SUM(usage_count) as count
    FROM eval_project_usage
    WHERE project_id = ?
    GROUP BY user_name, department
    ORDER BY count DESC
    LIMIT 15
  `).all(id) as any[];

  res.json({
    project,
    stats: {
      total_records: counters?.total_records || 0,
      active_users: counters?.active_users || 0,
      active_departments: counters?.active_departments || 0,
      total_usage: counters?.total_usage || 0,
      target_users: project.target_users,
      adoption_rate: project.target_users > 0 ? Math.round(((counters?.active_users || 0) / project.target_users) * 100) : 0
    },
    trend,
    departmentDistribution,
    activityDistribution,
    topUsers
  });
}));

// GET overall timeline for all projects combined
router.get("/all-timelines", asyncHandler(async (req, res) => {
  const timelines = db.prepare(`
    SELECT t.*, p.name as project_name 
    FROM eval_project_timeline t
    JOIN eval_projects p ON t.project_id = p.id
    ORDER BY t.target_date ASC
  `).all();
  res.json(timelines);
}));

// GET timeline for a specific project
router.get("/:id/timeline", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const timeline = db.prepare("SELECT * FROM eval_project_timeline WHERE project_id = ? ORDER BY target_date ASC").all(id);
  res.json(timeline);
}));

// POST new timeline event for a project
router.post("/:id/timeline", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, target_date, status } = req.body;

  if (!title || !target_date) {
    throw new AppError("Judul timeline dan Tanggal Target wajib diisi", 400);
  }

  const info = db.prepare(`
    INSERT INTO eval_project_timeline (project_id, title, description, target_date, status)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, title, description || null, target_date, status || 'pending');

  const newItem = db.prepare("SELECT * FROM eval_project_timeline WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(newItem);
}));

// PUT update a timeline event status or fields
router.put("/:id/timeline/:timelineId", asyncHandler(async (req, res) => {
  const { timelineId } = req.params;
  const { title, description, target_date, status } = req.body;

  if (!title || !target_date) {
    throw new AppError("Judul timeline dan Tanggal Target wajib diisi", 400);
  }

  db.prepare(`
    UPDATE eval_project_timeline
    SET title = ?, description = ?, target_date = ?, status = ?
    WHERE id = ?
  `).run(title, description || null, target_date, status || 'pending', timelineId);

  const updatedItem = db.prepare("SELECT * FROM eval_project_timeline WHERE id = ?").get(timelineId);
  res.json(updatedItem);
}));

// DELETE a timeline event
router.delete("/:id/timeline/:timelineId", asyncHandler(async (req, res) => {
  const { timelineId } = req.params;
  db.prepare("DELETE FROM eval_project_timeline WHERE id = ?").run(timelineId);
  res.json({ success: true });
}));

export default router;
