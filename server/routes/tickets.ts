import express from "express";
import db from "../db.ts";
import { sendNotificationEmail, sendTelegramNotification, sendUserNotificationEmail, sendActionRecommendationEmails, createDbNotification } from "../utils/notifications.ts";
import { Server } from "socket.io";
import { asyncHandler } from "../utils/asyncHandler.ts";
import type { Ticket, User, TicketLog } from "../types.ts";
import { AppError } from "../utils/errors.ts";
import { saveMediaFile } from "../utils/fileStorage.ts";

export default function(io: Server) {
  const router = express.Router();

  router.get("/", asyncHandler(async (req: any, res: any) => {
    console.log('GET /api/tickets', req.query);
    const { username, role } = req.query;
    // Exclude 'photo' from the list to keep payload small
    const columns = "id, ticket_no, name, employee_index, department, phone, category, description, assigned_to, admin_reply, status, created_at, updated_at, responded_at, resolved_at, ip_address, user_agent, latitude, longitude, internal_notes, device_type, pc_code, rating, rating_feedback, rating_at, require_rating, action_type, action_notes";
    let tickets;
    if (role === 'Super Admin' || !username) {
      tickets = db.prepare(`SELECT ${columns} FROM tickets ORDER BY created_at DESC`).all() as Ticket[];
    } else {
      // Staff can see tickets assigned to them OR unassigned tickets (New)
      const user = db.prepare("SELECT full_name FROM users WHERE username = ?").get(username) as User | undefined;
      const fullName = user?.full_name || '';
      
      tickets = db.prepare(`
        SELECT ${columns} FROM tickets 
        WHERE assigned_to = ? 
        OR assigned_to = ? 
        OR assigned_to IS NULL 
        OR assigned_to = '' 
        ORDER BY created_at DESC
      `).all(username, fullName) as Ticket[];
    }
    res.json(tickets);
  }));

  router.get("/:id", asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const ticket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(id) as Ticket | undefined;
    if (!ticket) throw new AppError("Ticket not found", 404);
    res.json(ticket);
  }));

  router.get("/:id/photo", asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const ticket = db.prepare("SELECT photo FROM tickets WHERE id = ?").get(id) as { photo: string } | undefined;
    if (!ticket) throw new AppError("Ticket not found", 404);
    res.json({ photo: ticket.photo });
  }));

  router.get("/:id/face_photo", asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const ticket = db.prepare("SELECT face_photo FROM tickets WHERE id = ?").get(id) as { face_photo: string } | undefined;
    if (!ticket) throw new AppError("Ticket not found", 404);
    res.json({ face_photo: ticket.face_photo });
  }));

  router.get("/:id/logs", asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const logs = db.prepare("SELECT * FROM ticket_logs WHERE ticket_id = ? ORDER BY created_at DESC").all(id) as TicketLog[];
    res.json(logs);
  }));

  router.get("/history/:index", asyncHandler(async (req: any, res: any) => {
    const { index } = req.params;
    const columns = "id, ticket_no, name, employee_index, department, phone, category, description, assigned_to, admin_reply, status, created_at, updated_at, responded_at, resolved_at, priority, device_type, pc_code, rating, rating_feedback, rating_at, require_rating, action_type, action_notes";
    const tickets = db.prepare(`SELECT ${columns} FROM tickets WHERE employee_index = ? ORDER BY created_at DESC`).all(index) as Ticket[];
    res.json(tickets);
  }));

  router.get("/unrated/check", asyncHandler(async (req: any, res: any) => {
    const { name, employee_index, phone } = req.query;
    
    let unrated: any[] = [];
    const cleanName = (name || '').toString().trim();
    const cleanIndex = (employee_index || '').toString().trim();
    const cleanPhone = (phone || '').toString().replace(/\D/g, '');

    if (cleanIndex) {
      unrated = db.prepare(`
        SELECT id, ticket_no, name, employee_index, department, phone, category, description, assigned_to, resolved_at, created_at, status, require_rating 
        FROM tickets 
        WHERE status = 'Completed' AND require_rating = 1 AND (rating IS NULL OR rating = 0) AND employee_index = ?
        ORDER BY resolved_at DESC
      `).all(cleanIndex);
    } else if (cleanName) {
      unrated = db.prepare(`
        SELECT id, ticket_no, name, employee_index, department, phone, category, description, assigned_to, resolved_at, created_at, status, require_rating 
        FROM tickets 
        WHERE status = 'Completed' AND require_rating = 1 AND (rating IS NULL OR rating = 0) AND LOWER(TRIM(name)) = LOWER(?)
        ORDER BY resolved_at DESC
      `).all(cleanName);
    } else if (cleanPhone && cleanPhone.length >= 8) {
      unrated = db.prepare(`
        SELECT id, ticket_no, name, employee_index, department, phone, category, description, assigned_to, resolved_at, created_at, status, require_rating 
        FROM tickets 
        WHERE status = 'Completed' AND require_rating = 1 AND (rating IS NULL OR rating = 0) AND (phone LIKE ? OR phone LIKE ?)
        ORDER BY resolved_at DESC
      `).all(`%${cleanPhone}%`, `%${cleanPhone.slice(-8)}%`);
    }

    res.json(unrated);
  }));

  router.post("/:id/rate", asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const { rating, rating_feedback, user_name } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      throw new AppError("Rating harus bernilai 1 sampai 5 bintang", 400);
    }

    const ticket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(id) as Ticket | undefined;
    if (!ticket) {
      throw new AppError("Tiket tidak ditemukan", 404);
    }

    db.prepare(`
      UPDATE tickets 
      SET rating = ?, rating_feedback = ?, rating_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(rating, rating_feedback || '', id);

    // Insert log
    db.prepare(`
      INSERT INTO ticket_logs (ticket_id, action, note, performed_by) 
      VALUES (?, ?, ?, ?)
    `).run(
      id,
      'Rating & Ulasan',
      `Memberikan nilai ${rating}/5 Bintang${rating_feedback ? ': "' + rating_feedback + '"' : ''}`,
      user_name || ticket.name || 'User'
    );

    const updatedTicket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(id) as Ticket;
    io.emit("ticket_updated", updatedTicket);

    res.json({ success: true, ticket: updatedTicket });
  }));

  router.post("/", asyncHandler(async (req: any, res: any) => {
    const { name, department, phone, category, description, photo, face_photo, latitude, longitude, priority, employee_index, device_type, pc_code } = req.body;
    console.log('Incoming ticket data:', { name, department, phone, category, hasPhoto: !!photo, hasFacePhoto: !!face_photo, lat: latitude, lng: longitude, employee_index, device_type, pc_code });
    
    if (!name || !department || !category) {
      throw new AppError("Missing required fields", 400);
    }

    const finalPhone = phone || "-";

    // Generate ticket_no: YYYYMMDDNNN
    const utcNow = new Date();
    const jakartaNow = new Date(utcNow.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const year = jakartaNow.getFullYear().toString();
    const month = (jakartaNow.getMonth() + 1).toString().padStart(2, '0');
    const day = jakartaNow.getDate().toString().padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;

    const lastTicket = db.prepare("SELECT ticket_no FROM tickets WHERE ticket_no LIKE ? ORDER BY ticket_no DESC LIMIT 1")
      .get(`${datePrefix}%`) as { ticket_no: string } | undefined;

    let sequence = 1;
    if (lastTicket && lastTicket.ticket_no) {
      const lastSeq = parseInt(lastTicket.ticket_no.slice(-3));
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }
    const ticketNo = `${datePrefix}${sequence.toString().padStart(3, '0')}`;
    console.log('Generated ticketNo:', ticketNo);

    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Auto-mapping logic with Multi-PIC & Duty Status fallback
    let assignedTo = 'yudha'; // Default fallback
    const catInfo = db.prepare("SELECT assigned_to, assigned_to_list FROM categories WHERE name = ?").get(category) as { assigned_to: string; assigned_to_list?: string } | undefined;
    
    let candidatePics: string[] = [];
    if (catInfo) {
      if (catInfo.assigned_to_list) {
        try {
          const parsed = JSON.parse(catInfo.assigned_to_list);
          if (Array.isArray(parsed)) candidatePics = parsed.map((s: any) => String(s).trim()).filter(Boolean);
        } catch {
          candidatePics = catInfo.assigned_to_list.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
      if (candidatePics.length === 0 && catInfo.assigned_to) {
        candidatePics = [catInfo.assigned_to.trim()];
      }
    }

    let selectedPic: string | null = null;
    for (const cand of candidatePics) {
      const user = db.prepare("SELECT username, is_on_duty FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(full_name) = LOWER(?)").get(cand, cand) as { username: string; is_on_duty?: number } | undefined;
      // If user is registered and on duty (is_on_duty != 0), select this PIC
      if (!user || user.is_on_duty === undefined || user.is_on_duty === null || user.is_on_duty === 1) {
        selectedPic = user ? user.username : cand;
        break;
      }
    }

    if (selectedPic) {
      assignedTo = selectedPic;
    } else {
      // If all designated PICs are Off, assign to an active Super Admin
      const activeSuperAdmin = db.prepare("SELECT username FROM users WHERE (role = 'Super Admin' OR role = 'superadmin' OR username = 'admin' OR username = 'yudha') AND (is_on_duty IS NULL OR is_on_duty = 1) LIMIT 1").get() as { username: string } | undefined;
      if (activeSuperAdmin && activeSuperAdmin.username) {
        assignedTo = activeSuperAdmin.username;
      } else {
        assignedTo = 'yudha';
      }
      console.log(`[AUTO-ASSIGN] Semse PIC Kategori '${category}' sedang Off. Tiket #${ticketNo} diambil alih Superadmin: ${assignedTo}`);
    }

    const savedPhoto = saveMediaFile(photo, { entityType: 'ticket_photo', identifier: ticketNo, name });
    const savedFacePhoto = saveMediaFile(face_photo, { entityType: 'ticket_face_photo', identifier: ticketNo, name });

    const info = db.prepare(
      "INSERT INTO tickets (ticket_no, name, department, phone, category, description, photo, face_photo, created_at, ip_address, user_agent, latitude, longitude, assigned_to, status, priority, employee_index, device_type, pc_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(ticketNo, name, department, finalPhone, category, description || "", savedPhoto || null, savedFacePhoto || null, utcNow.toISOString(), String(ip), String(userAgent), latitude || null, longitude || null, assignedTo, 'New', priority || 'Medium', employee_index || null, device_type || null, pc_code || null);
    
    const newTicket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(info.lastInsertRowid) as Ticket;
    
    // Targeted Telegram Notification simulation
    console.log(`[TELEGRAM] Targeted Notification for ${assignedTo.toUpperCase()}: New ticket ${ticketNo} in category ${category}`);
    
    // Send Email Notification
    const notificationEmailsRaw = db.prepare("SELECT value FROM settings WHERE key = 'notification_emails'").get() as { value: string } | undefined;
    if (notificationEmailsRaw) {
      try {
        const emails = JSON.parse(notificationEmailsRaw.value);
        sendNotificationEmail(newTicket, emails);
      } catch (e) {
        console.error('Error parsing notification emails:', e);
      }
    }

    // Send Telegram Notification
    const telegramTokenRaw = db.prepare("SELECT value FROM settings WHERE key = 'telegram_bot_token'").get() as { value: string } | undefined;
    const telegramChatIdsRaw = db.prepare("SELECT value FROM settings WHERE key = 'telegram_chat_ids'").get() as { value: string } | undefined;
    
    if (telegramTokenRaw?.value && telegramChatIdsRaw?.value) {
      try {
        const chatIds = JSON.parse(telegramChatIdsRaw.value);
        sendTelegramNotification(newTicket, telegramTokenRaw.value, chatIds);
      } catch (e) {
        console.error('Error parsing telegram settings:', e);
      }
    }

    // Send Email to User (Submit)
    sendUserNotificationEmail(newTicket, 'submit');

    res.status(201).json(newTicket);
    io.emit("ticket_created", newTicket);

    // Trigger auto-respond check immediately
    processAutoRespond(io);
  }));

  // Background auto-respond interval every 10 seconds
  setInterval(() => {
    processAutoRespond(io);
  }, 10000);

  router.patch("/:id", asyncHandler(async (req: any, res: any) => {
    await handleTicketUpdate(req, res, io);
  }));

  router.put("/:id", asyncHandler(async (req: any, res: any) => {
    await handleTicketUpdate(req, res, io);
  }));

  router.post("/reset", asyncHandler(async (req: any, res: any) => {
    const { password } = req.body;
    if (password !== 'root') {
      throw new AppError("Password konfirmasi salah!", 403);
    }
    db.transaction(() => {
      db.prepare("DELETE FROM ticket_logs").run();
      db.prepare("DELETE FROM notifications").run();
      db.prepare("DELETE FROM tickets").run();
    })();
    io.emit("ticketUpdated");
    res.json({ success: true, message: "Semua data tiket berhasil direset" });
  }));

  router.delete("/:id", asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const { password } = req.body;
    
    if (password !== 'root') {
      throw new AppError("Password konfirmasi salah!", 403);
    }

    const ticket = db.prepare("SELECT id FROM tickets WHERE id = ?").get(id);
    if (!ticket) throw new AppError("Ticket not found", 404);
    
    const deleteTransaction = db.transaction(() => {
      db.prepare("DELETE FROM ticket_logs WHERE ticket_id = ?").run(id);
      db.prepare("DELETE FROM notifications WHERE ticket_id = ?").run(id);
      db.prepare("DELETE FROM tickets WHERE id = ?").run(id);
    });
    
    deleteTransaction();
    io.emit("ticketUpdated");
    res.json({ success: true, message: "Ticket deleted" });
  }));

  return router;
}

async function handleTicketUpdate(req: any, res: any, io: Server) {
  const { id } = req.params;
  const { status, assigned_to, admin_reply, internal_notes, takeover_by, reassign_to, performed_by, note, priority, estimated_duration, estimated_start_at, estimated_target_at, require_rating, action_type, action_notes } = req.body;
  
  const currentTicket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(id) as Ticket | undefined;
  if (!currentTicket) throw new AppError("Ticket not found", 404);

  let respondedAt = currentTicket.responded_at;
  let resolvedAt: any = currentTicket.resolved_at;
  let newStatus = status !== undefined ? status : currentTicket.status;
  let newAssignedTo = assigned_to !== undefined ? assigned_to : currentTicket.assigned_to;
  let newPriority = priority !== undefined ? priority : currentTicket.priority;
  let newAdminReply = admin_reply !== undefined ? admin_reply : currentTicket.admin_reply;
  let newInternalNotes = internal_notes !== undefined ? internal_notes : currentTicket.internal_notes;
  let newEstDuration = estimated_duration !== undefined ? estimated_duration : currentTicket.estimated_duration;
  let newEstStart = estimated_start_at !== undefined ? estimated_start_at : currentTicket.estimated_start_at;
  let newEstTarget = estimated_target_at !== undefined ? estimated_target_at : currentTicket.estimated_target_at;
  let newRequireRating = require_rating !== undefined ? (require_rating ? 1 : 0) : (currentTicket.require_rating || 0);
  let newActionType = action_type !== undefined ? action_type : (currentTicket.action_type || 'none');
  let newActionNotes = action_notes !== undefined ? action_notes : (currentTicket.action_notes || '');

  const logs: any[] = [];

  if (takeover_by) {
    newAssignedTo = takeover_by;
    logs.push({ action: 'Takeover', note: `Ticket taken over by ${takeover_by}`, performed_by: performed_by || takeover_by });
  } else if (reassign_to) {
    newAssignedTo = reassign_to;
    logs.push({ action: 'Reassigned', note: `Ticket reassigned to ${reassign_to}`, performed_by: performed_by || 'System' });
  }

  if (priority !== undefined && priority !== currentTicket.priority) {
    logs.push({ action: 'Priority Changed', note: `Priority changed from ${currentTicket.priority} to ${priority}`, performed_by: performed_by || 'System' });
  }

  if (status !== undefined && status !== currentTicket.status) {
    logs.push({ action: 'Status Changed', note: `Status changed from ${currentTicket.status} to ${status}${note ? ': ' + note : ''}`, performed_by: performed_by || 'System' });
  }

  if (assigned_to !== undefined && assigned_to !== currentTicket.assigned_to && !takeover_by && !reassign_to) {
    logs.push({ action: 'Assigned', note: `Assigned to ${assigned_to}`, performed_by: performed_by || 'System' });
  }

  if (admin_reply !== undefined && admin_reply !== currentTicket.admin_reply) {
    logs.push({ action: 'Admin Reply', note: admin_reply || '(Empty Reply)', performed_by: performed_by || 'System' });
  }

  if (estimated_duration !== undefined && estimated_duration !== currentTicket.estimated_duration) {
    logs.push({ action: 'Estimasi Pengerjaan', note: `Estimasi waktu: ${estimated_duration || 'Dihapus'}`, performed_by: performed_by || 'System' });
  }

  if (require_rating !== undefined && newRequireRating !== (currentTicket.require_rating || 0)) {
    logs.push({ action: 'Minta Rating', note: newRequireRating ? 'Permintaan rating layanan diaktifkan' : 'Permintaan rating layanan dinonaktifkan', performed_by: performed_by || 'System' });
  }

  if (action_type !== undefined && action_type !== currentTicket.action_type) {
    const actLabel = action_type === 'Dipinjamkan' ? 'Dipinjamkan (Perangkat Pengganti)' : action_type === 'Harus Dibeli' ? 'Harus Dibeli (Pengadaan Baru)' : 'Biasa / Normal';
    logs.push({ action: 'Tindakan IT', note: `Opsi tindakan IT: ${actLabel}${action_notes ? ' - Catatan: ' + action_notes : ''}`, performed_by: performed_by || 'System' });
  }

  if (!respondedAt && (admin_reply !== undefined || (newStatus !== 'New' && newStatus !== currentTicket.status))) {
    respondedAt = new Date().toISOString();
  }

  if (newStatus === 'Completed' && !resolvedAt) {
    resolvedAt = new Date().toISOString();
  } else if (newStatus !== 'Completed') {
    resolvedAt = null;
  }

  db.prepare("UPDATE tickets SET status = ?, assigned_to = ?, admin_reply = ?, internal_notes = ?, priority = ?, responded_at = ?, resolved_at = ?, estimated_duration = ?, estimated_start_at = ?, estimated_target_at = ?, require_rating = ?, action_type = ?, action_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(newStatus, newAssignedTo, newAdminReply, newInternalNotes, newPriority, respondedAt, resolvedAt, newEstDuration, newEstStart, newEstTarget, newRequireRating, newActionType, newActionNotes, id);
  
  const insertLog = db.prepare("INSERT INTO ticket_logs (ticket_id, action, note, performed_by) VALUES (?, ?, ?, ?)");
  logs.forEach(log => {
    insertLog.run(id, log.action, log.note, log.performed_by);
  });

  if (newStatus === 'Completed' && currentTicket.status !== 'Completed') {
    const updatedTicket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(id) as Ticket;
    sendUserNotificationEmail(updatedTicket, 'done');
  }

  // Helper to get supervisors/atasan for a ticket creator
  const getSupervisors = (ticket: any) => {
    const sups: { employee_index: string | null; name: string }[] = [];
    const addedIds = new Set<number>();

    let creator: any = null;
    if (ticket.employee_index) {
      creator = db.prepare("SELECT * FROM master_users WHERE employee_index = ?").get(ticket.employee_index);
    }
    if (!creator && ticket.name) {
      creator = db.prepare("SELECT * FROM master_users WHERE LOWER(full_name) = LOWER(?)").get(ticket.name);
    }

    if (creator && creator.atasan_id) {
      const atasan = db.prepare("SELECT * FROM master_users WHERE id = ?").get(creator.atasan_id) as any;
      if (atasan) {
        sups.push({ employee_index: atasan.employee_index || null, name: atasan.full_name });
        addedIds.add(atasan.id);
      }
    }

    const dept = ticket.department || creator?.department;
    if (dept) {
      const deptSupervisors = db.prepare(`
        SELECT * FROM master_users 
        WHERE (LOWER(department) = LOWER(?) OR LOWER(sub_department) = LOWER(?))
          AND (LOWER(jabatan) LIKE '%head%' OR LOWER(jabatan) LIKE '%manager%' OR LOWER(jabatan) LIKE '%atasan%')
      `).all(dept, dept) as any[];

      deptSupervisors.forEach(sup => {
        if (!addedIds.has(sup.id)) {
          sups.push({ employee_index: sup.employee_index || null, name: sup.full_name });
          addedIds.add(sup.id);
        }
      });
    }

    return sups;
  };

  const supervisors = getSupervisors(currentTicket);

  // Generate DB notification for user when status changes
  if (status !== undefined && status !== currentTicket.status) {
    createDbNotification({
      ticket_id: currentTicket.id,
      ticket_no: currentTicket.ticket_no,
      employee_index: currentTicket.employee_index,
      recipient_name: currentTicket.name,
      title: `Status Tiket #${currentTicket.ticket_no} Berubah`,
      message: `Status tiket Anda diubah dari "${currentTicket.status}" menjadi "${newStatus}"${note ? '. Catatan: ' + note : '.'}`,
      type: 'status_change'
    }, io);
  }

  // Generate DB notification for user when admin replies
  if (admin_reply !== undefined && admin_reply !== currentTicket.admin_reply && admin_reply.trim()) {
    createDbNotification({
      ticket_id: currentTicket.id,
      ticket_no: currentTicket.ticket_no,
      employee_index: currentTicket.employee_index,
      recipient_name: currentTicket.name,
      title: `Balasan Baru Tiket #${currentTicket.ticket_no}`,
      message: `IT Support (${performed_by || 'Admin'}): "${admin_reply.trim()}"`,
      type: 'admin_reply'
    }, io);
  }

  // Generate DB notification for user and atasan when action_type changes
  if (action_type !== undefined && action_type !== currentTicket.action_type && action_type !== 'none') {
    const isLoan = action_type === 'Dipinjamkan';
    
    // 1. Notification for Pemohon (Ticket creator)
    createDbNotification({
      ticket_id: currentTicket.id,
      ticket_no: currentTicket.ticket_no,
      employee_index: currentTicket.employee_index,
      recipient_name: currentTicket.name,
      title: isLoan
        ? `📦 Peminjaman Perangkat/Part - Tiket #${currentTicket.ticket_no}`
        : `🚨 Rekomendasi Pembelian Urgent - Tiket #${currentTicket.ticket_no}`,
      message: isLoan
        ? `IT menyetujui peminjaman unit/part pengganti sementara.${action_notes ? ' Catatan IT: ' + action_notes : ''}`
        : `IT menetapkan rekomendasi pengadaan/pembelian perangkat baru URGENT.${action_notes ? ' Catatan IT: ' + action_notes : ''}`,
      type: isLoan ? 'part_loan' : 'urgent_purchase'
    }, io);

    // 2. Notification for Atasan / Supervisors (e.g. Puji Sulastiana)
    supervisors.forEach(sup => {
      createDbNotification({
        ticket_id: currentTicket.id,
        ticket_no: currentTicket.ticket_no,
        employee_index: sup.employee_index,
        recipient_name: sup.name,
        title: isLoan
          ? `📦 Peminjaman Part - Tiket #${currentTicket.ticket_no} (${currentTicket.name})`
          : `🚨 Pembelian Urgent - Tiket #${currentTicket.ticket_no} (${currentTicket.name})`,
        message: isLoan
          ? `IT menyetujui peminjaman unit/part pengganti untuk anggota tim Anda (${currentTicket.name}).${action_notes ? ' Catatan IT: ' + action_notes : ''}`
          : `IT menetapkan rekomendasi pembelian/pengadaan baru URGENT untuk anggota tim Anda (${currentTicket.name}).${action_notes ? ' Catatan IT: ' + action_notes : ''}`,
        type: isLoan ? 'part_loan' : 'urgent_purchase'
      }, io);
    });

    // 3. Send Email Notifications to Pemohon & Supervisors
    sendActionRecommendationEmails(currentTicket, action_type, action_notes || '', supervisors);
  }

  res.json({ success: true });
  io.emit("ticket_updated", { id, status: newStatus, assigned_to: newAssignedTo, priority: newPriority });
}

export function processAutoRespond(io: Server) {
  try {
    const settingsRows = db.prepare("SELECT key, value FROM settings WHERE key LIKE 'yudha_auto_respond_%'").all() as { key: string, value: string }[];
    const settingsMap: Record<string, any> = {};
    settingsRows.forEach(r => {
      try { settingsMap[r.key] = JSON.parse(r.value); } catch { settingsMap[r.key] = r.value; }
    });

    const isEnabled = String(settingsMap.yudha_auto_respond_enabled) === 'true';
    if (!isEnabled) return;

    let targetCategories: string[] = [];
    if (Array.isArray(settingsMap.yudha_auto_respond_categories)) {
      targetCategories = settingsMap.yudha_auto_respond_categories;
    } else if (typeof settingsMap.yudha_auto_respond_categories === 'string' && settingsMap.yudha_auto_respond_categories.trim()) {
      try {
        targetCategories = JSON.parse(settingsMap.yudha_auto_respond_categories);
      } catch {
        targetCategories = settingsMap.yudha_auto_respond_categories.split(',').map(s => s.trim());
      }
    }

    const delayMins = parseInt(settingsMap.yudha_auto_respond_delay ?? '5', 10) || 0;
    const assignee = settingsMap.yudha_auto_respond_assignee || 'yudha';

    // Query tickets with status 'New' or 'Baru'
    const newTickets = db.prepare("SELECT * FROM tickets WHERE status IN ('New', 'Baru')").all() as Ticket[];
    if (!newTickets || newTickets.length === 0) return;

    const now = new Date();

    for (const ticket of newTickets) {
      // Check category match
      const isAll = targetCategories.length === 0 || targetCategories.includes('ALL');
      const categoryMatches = isAll || targetCategories.includes(ticket.category);
      if (!categoryMatches) continue;

      // Calculate ticket age in minutes
      const rawDate = ticket.created_at || '';
      const createdAt = new Date(rawDate.includes('T') ? rawDate : rawDate.replace(' ', 'T'));
      const ageMins = (now.getTime() - createdAt.getTime()) / (1000 * 60);

      if (ageMins >= delayMins) {
        // Auto respond this ticket to 'In Progress'
        const respondedAt = now.toISOString();
        db.prepare("UPDATE tickets SET status = 'In Progress', assigned_to = ?, responded_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
          .run(assignee, respondedAt, ticket.id);

        // Add ticket log
        db.prepare("INSERT INTO ticket_logs (ticket_id, action, note, performed_by) VALUES (?, ?, ?, ?)")
          .run(ticket.id, 'Auto Respond', `Sistem otomatis merespon tiket ke status Progres (${delayMins} menit auto-respond)`, `System (${assignee})`);

        const updatedTicket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(ticket.id) as Ticket;
        
        createDbNotification({
          ticket_id: updatedTicket.id,
          ticket_no: updatedTicket.ticket_no,
          employee_index: updatedTicket.employee_index,
          recipient_name: updatedTicket.name,
          title: `Tiket #${updatedTicket.ticket_no} Sedang Diproses`,
          message: `Tiket Anda telah direspon otomatis dan saat ini sedang ditangani oleh IT Support (${assignee}).`,
          type: 'auto_respond'
        }, io);

        console.log(`[AUTO-RESPOND] Ticket #${updatedTicket.ticket_no || updatedTicket.id} auto-responded for ${assignee} (age: ${Math.round(ageMins)}m)`);
        io.emit("ticket_updated", updatedTicket);
      }
    }
  } catch (err) {
    console.error('Error in processAutoRespond:', err);
  }
}
