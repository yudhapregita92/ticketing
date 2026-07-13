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
  const project = db.prepare("SELECT * FROM eval_projects WHERE id = ?").get(id) as any;
  if (!project) {
    throw new AppError("Project tidak ditemukan", 404);
  }

  const isM365 = project.name.toLowerCase().includes("m365");
  const isWhatsapp = project.name.toLowerCase().includes("whatsapp") || project.name.toLowerCase().includes("omni");

  if (isM365) {
    const insertTransaction = db.transaction((projectId: number, rows: any[]) => {
      const checkStmt = db.prepare(`
        SELECT id FROM eval_m365_usage 
        WHERE project_id = ? AND periode_bulan = ? AND user_principal_name = ?
      `);

      const insertStmt = db.prepare(`
        INSERT INTO eval_m365_usage (
          project_id, periode_bulan, user_principal_name, display_name, department, activet,
          license_m365, email_exchange, one_drive, storage_used, teams, reason_teams,
          outlook_for_mobile, reason_hp, outlook_for_web, reason_web
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const updateStmt = db.prepare(`
        UPDATE eval_m365_usage
        SET display_name = ?,
            department = ?,
            activet = ?,
            license_m365 = ?,
            email_exchange = ?,
            one_drive = ?,
            storage_used = ?,
            teams = ?,
            reason_teams = ?,
            outlook_for_mobile = ?,
            reason_hp = ?,
            outlook_for_web = ?,
            reason_web = ?
        WHERE id = ?
      `);
      
      for (const r of rows) {
        const p_bulan = String(r.periode_bulan || r.periodeBulan || r['Periode bulan'] || '');
        const upn = String(r.user_principal_name || r.userPrincipalName || r['User Principal Name'] || '');
        
        const existing = checkStmt.get(projectId, p_bulan, upn) as any;

        const displayName = String(r.display_name || r.displayName || r['Display Name'] || '');
        const dept = String(r.department || r['Department'] || 'Divisi Umum');
        const active = String(r.activet || r.active || r['Activet'] || r['Active'] || 'Active');
        const license = String(r.license_m365 || r.licenseM365 || r['License M365'] || '');
        const emailExchange = String(r.email_exchange !== undefined ? r.email_exchange : r.emailExchange !== undefined ? r.emailExchange : r['Email Exchange'] !== undefined ? r['Email Exchange'] : '');
        const oneDrive = String(r.one_drive !== undefined ? r.one_drive : r.oneDrive !== undefined ? r.oneDrive : r['One drive'] !== undefined ? r['One drive'] : '');
        const storageUsed = String(r.storage_used !== undefined ? r.storage_used : r.storageUsed !== undefined ? r.storageUsed : r.storageUsedByte !== undefined ? r.storageUsedByte : r['Storage Used (Byte)'] !== undefined ? r['Storage Used (Byte)'] : '');
        const teams = String(r.teams !== undefined ? r.teams : r['Teams'] !== undefined ? r['Teams'] : '');
        const reasonTeams = String(r.reason_teams !== undefined ? r.reason_teams : r.reasonTeams !== undefined ? r.reasonTeams : r['Reason Teams'] !== undefined ? r['Reason Teams'] : '');
        const outlookHP = String(r.outlook_for_mobile !== undefined ? r.outlook_for_mobile : r.outlookForMobile !== undefined ? r.outlookForMobile : r['Outlook For Mobile'] !== undefined ? r['Outlook For Mobile'] : '');
        const reasonHP = String(r.reason_hp !== undefined ? r.reason_hp : r.reasonHp !== undefined ? r.reasonHp : r['Reason HP'] !== undefined ? r['Reason HP'] : '');
        const outlookWeb = String(r.outlook_for_web !== undefined ? r.outlook_for_web : r.outlookForWeb !== undefined ? r.outlookForWeb : r['Outlook For Web'] !== undefined ? r['Outlook For Web'] : '');
        const reasonWeb = String(r.reason_web !== undefined ? r.reason_web : r.reasonWeb !== undefined ? r.reasonWeb : r['Reason web'] !== undefined ? r['Reason web'] : '');

        if (existing) {
          updateStmt.run(
            displayName,
            dept,
            active,
            license,
            emailExchange,
            oneDrive,
            storageUsed,
            teams,
            reasonTeams,
            outlookHP,
            reasonHP,
            outlookWeb,
            reasonWeb,
            existing.id
          );
        } else {
          insertStmt.run(
            projectId,
            p_bulan,
            upn,
            displayName,
            dept,
            active,
            license,
            emailExchange,
            oneDrive,
            storageUsed,
            teams,
            reasonTeams,
            outlookHP,
            reasonHP,
            outlookWeb,
            reasonWeb
          );
        }
      }
    });

    insertTransaction(Number(id), records);
  } else if (isWhatsapp) {
    const insertTransaction = db.transaction((projectId: number, rows: any[]) => {
      const checkStmt = db.prepare(`
        SELECT id FROM eval_whatsapp_usage 
        WHERE project_id = ? AND agent_name = ? AND department = ? AND case_details = ?
      `);

      const insertStmt = db.prepare(`
        INSERT INTO eval_whatsapp_usage (
          project_id, agent_name, department, case_count, already_rated, not_rated,
          very_dissatisfied, dissatisfied, neutral, satisfied, very_satisfied, case_details
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const updateStmt = db.prepare(`
        UPDATE eval_whatsapp_usage
        SET case_count = ?,
            already_rated = ?,
            not_rated = ?,
            very_dissatisfied = ?,
            dissatisfied = ?,
            neutral = ?,
            satisfied = ?,
            very_satisfied = ?
        WHERE id = ?
      `);

      for (const r of rows) {
        const agentName = r.agent_name || 'User Umum';
        const department = r.department || 'Divisi Umum';
        const caseCount = Number(r.case_count) || 0;
        const alreadyRated = Number(r.already_rated) || 0;
        const notRated = Number(r.not_rated) || 0;
        const veryDissatisfied = Number(r.very_dissatisfied) || 0;
        const dissatisfied = Number(r.dissatisfied) || 0;
        const neutral = Number(r.neutral) || 0;
        const satisfied = Number(r.satisfied) || 0;
        const verySatisfied = Number(r.very_satisfied) || 0;
        const caseDetails = String(r.case_details || '');

        if (!agentName && !department) continue;

        const existing = checkStmt.get(projectId, agentName, department, caseDetails) as any;
        if (existing) {
          updateStmt.run(
            caseCount,
            alreadyRated,
            notRated,
            veryDissatisfied,
            dissatisfied,
            neutral,
            satisfied,
            verySatisfied,
            existing.id
          );
        } else {
          insertStmt.run(
            projectId,
            agentName,
            department,
            caseCount,
            alreadyRated,
            notRated,
            veryDissatisfied,
            dissatisfied,
            neutral,
            satisfied,
            verySatisfied,
            caseDetails
          );
        }
      }
    });

    insertTransaction(Number(id), records);
  } else {
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
  }

  res.json({ success: true, count: records.length });
}));

// POST to clear all records of a project
router.post("/:id/clear", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const project = db.prepare("SELECT * FROM eval_projects WHERE id = ?").get(id) as any;
  if (project && project.name.toLowerCase().includes("m365")) {
    db.prepare("DELETE FROM eval_m365_usage WHERE project_id = ?").run(id);
  } else if (project && (project.name.toLowerCase().includes("whatsapp") || project.name.toLowerCase().includes("omni"))) {
    db.prepare("DELETE FROM eval_whatsapp_usage WHERE project_id = ?").run(id);
  } else {
    db.prepare("DELETE FROM eval_project_usage WHERE project_id = ?").run(id);
  }
  res.json({ success: true });
}));

// GET dashboard stats for a specific project
router.get("/:id/dashboard", asyncHandler(async (req, res) => {
  const { id } = req.params;

  const project = db.prepare("SELECT * FROM eval_projects WHERE id = ?").get(id) as any;
  if (!project) {
    throw new AppError("Project tidak ditemukan", 404);
  }

  const isM365 = project.name.toLowerCase().includes("m365");
  const isWhatsapp = project.name.toLowerCase().includes("whatsapp") || project.name.toLowerCase().includes("omni");

  if (isM365) {
    // M365 Stats
    const counters = db.prepare(`
      SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN LOWER(activet) = 'active' OR LOWER(activet) = 'activet' THEN 1 ELSE 0 END) as active_users,
        COUNT(DISTINCT department) as active_departments
      FROM eval_m365_usage
      WHERE project_id = ?
    `).get(id) as any;

    const totalUsage = db.prepare(`
      SELECT COUNT(*) as count FROM eval_m365_usage WHERE project_id = ?
    `).get(id) as any;

    // Get trend over time (by periode_bulan)
    const trend = db.prepare(`
      SELECT 
        periode_bulan as date,
        COUNT(*) as count,
        SUM(CASE WHEN LOWER(activet) = 'active' OR LOWER(activet) = 'activet' THEN 1 ELSE 0 END) as active_users
      FROM eval_m365_usage
      WHERE project_id = ?
      GROUP BY periode_bulan
      ORDER BY periode_bulan ASC
    `).all(id) as any[];

    // Department distribution
    const departmentDistribution = db.prepare(`
      SELECT 
        department,
        COUNT(*) as count,
        SUM(CASE WHEN LOWER(activet) = 'active' OR LOWER(activet) = 'activet' THEN 1 ELSE 0 END) as users
      FROM eval_m365_usage
      WHERE project_id = ?
      GROUP BY department
      ORDER BY count DESC
    `).all(id) as any[];

    // Activity / features distribution (M365 features: Email, OneDrive, Teams, Mobile Outlook, Web Outlook)
    const featuresStats = db.prepare(`
      SELECT
        SUM(CASE WHEN email_exchange = '1' OR email_exchange = 'Active' OR email_exchange = '1.0' THEN 1 ELSE 0 END) as email,
        SUM(CASE WHEN one_drive = '1' OR one_drive = 'Active' OR one_drive = '1.0' THEN 1 ELSE 0 END) as onedrive,
        SUM(CASE WHEN teams = '1' OR teams = 'Active' OR teams = '1.0' THEN 1 ELSE 0 END) as teams,
        SUM(CASE WHEN outlook_for_mobile = '1' OR outlook_for_mobile = 'Active' OR outlook_for_mobile = '1.0' THEN 1 ELSE 0 END) as mobile,
        SUM(CASE WHEN outlook_for_web = '1' OR outlook_for_web = 'Active' OR outlook_for_web = '1.0' THEN 1 ELSE 0 END) as web
      FROM eval_m365_usage
      WHERE project_id = ?
    `).get(id) as any;

    const activityDistribution = [
      { type: 'Email Exchange', count: featuresStats?.email || 0 },
      { type: 'One Drive', count: featuresStats?.onedrive || 0 },
      { type: 'Teams', count: featuresStats?.teams || 0 },
      { type: 'Outlook Mobile', count: featuresStats?.mobile || 0 },
      { type: 'Outlook Web', count: featuresStats?.web || 0 }
    ].sort((a, b) => b.count - a.count);

    // Top active users (order by active features count)
    const m365Raw = db.prepare(`
      SELECT * FROM eval_m365_usage WHERE project_id = ?
    `).all(id) as any[];

    const topUsers = m365Raw.map(u => {
      const activeCount = (u.email_exchange === '1' || u.email_exchange === 'Active' ? 1 : 0) +
                          (u.one_drive === '1' || u.one_drive === 'Active' ? 1 : 0) +
                          (u.teams === '1' || u.teams === 'Active' ? 1 : 0) +
                          (u.outlook_for_mobile === '1' || u.outlook_for_mobile === 'Active' ? 1 : 0) +
                          (u.outlook_for_web === '1' || u.outlook_for_web === 'Active' ? 1 : 0);
      return {
        user_name: u.display_name || u.user_principal_name || 'Tanpa Nama',
        department: u.department || 'Divisi Umum',
        count: activeCount
      };
    }).sort((a, b) => b.count - a.count).slice(0, 15);

    res.json({
      project,
      stats: {
        total_records: counters?.total_records || 0,
        active_users: counters?.active_users || 0,
        active_departments: counters?.active_departments || 0,
        total_usage: totalUsage?.count || 0,
        target_users: project.target_users,
        adoption_rate: project.target_users > 0 ? Math.round(((counters?.active_users || 0) / project.target_users) * 100) : 0
      },
      trend,
      departmentDistribution,
      activityDistribution,
      topUsers,
      m365Records: m365Raw
    });

  } else if (isWhatsapp) {
    // WhatsApp stats
    const counters = db.prepare(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT agent_name) as active_users,
        COUNT(DISTINCT department) as active_departments,
        SUM(case_count) as total_usage
      FROM eval_whatsapp_usage
      WHERE project_id = ?
    `).get(id) as any;

    // Department distribution
    const departmentDistribution = db.prepare(`
      SELECT 
        department,
        SUM(case_count) as count,
        COUNT(DISTINCT agent_name) as users
      FROM eval_whatsapp_usage
      WHERE project_id = ?
      GROUP BY department
      ORDER BY count DESC
    `).all(id) as any[];

    // Ratings breakdown
    const ratingStats = db.prepare(`
      SELECT 
        SUM(case_count) as total_cases,
        SUM(already_rated) as total_rated,
        SUM(not_rated) as total_unrated,
        SUM(very_dissatisfied) as very_dissatisfied,
        SUM(dissatisfied) as dissatisfied,
        SUM(neutral) as neutral,
        SUM(satisfied) as satisfied,
        SUM(very_satisfied) as very_satisfied
      FROM eval_whatsapp_usage
      WHERE project_id = ?
    `).get(id) as any;

    const activityDistribution = [
      { type: 'Sangat Tidak Puas', count: ratingStats?.very_dissatisfied || 0 },
      { type: 'Tidak Puas', count: ratingStats?.dissatisfied || 0 },
      { type: 'Netral', count: ratingStats?.neutral || 0 },
      { type: 'Puas', count: ratingStats?.satisfied || 0 },
      { type: 'Sangat Puas', count: ratingStats?.very_satisfied || 0 }
    ];

    // Top active agents (by case_count)
    const topUsers = db.prepare(`
      SELECT 
        agent_name as user_name,
        department,
        SUM(case_count) as count
      FROM eval_whatsapp_usage
      WHERE project_id = ?
      GROUP BY agent_name, department
      ORDER BY count DESC
      LIMIT 15
    `).all(id) as any[];

    const whatsappRecords = db.prepare(`
      SELECT * FROM eval_whatsapp_usage WHERE project_id = ?
    `).all(id) as any[];

    res.json({
      project,
      stats: {
        total_records: counters?.total_records || 0,
        active_users: counters?.active_users || 0,
        active_departments: counters?.active_departments || 0,
        total_usage: counters?.total_usage || 0,
        target_users: project.target_users,
        adoption_rate: project.target_users > 0 ? Math.round(((counters?.active_users || 0) / project.target_users) * 100) : 0,
        total_cases: ratingStats?.total_cases || 0,
        total_rated: ratingStats?.total_rated || 0,
        total_unrated: ratingStats?.total_unrated || 0,
        rating_stats: ratingStats
      },
      trend: departmentDistribution.map(d => ({ date: d.department, count: d.count, active_users: d.users })),
      departmentDistribution,
      activityDistribution,
      topUsers,
      whatsappRecords
    });

  } else {
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
  }
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
