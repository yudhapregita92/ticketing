import { Router } from "express";
import db from "../db.js";
import { sendNotificationEmail, sendTelegramNotification, sendUserNotificationEmail } from "../utils/notifications.js";
import { Server } from "socket.io";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Ticket, User, TicketLog } from "../types.js";
import { AppError } from "../utils/errors.js";

export default function(io: Server) {
  const router = Router();

  router.get("/", asyncHandler(async (req: any, res: any) => {
    console.log('GET /api/tickets', req.query);
    const { username, role } = req.query;
    // Exclude 'photo' from the list to keep payload small
    const columns = "id, ticket_no, name, department, phone, category, description, assigned_to, admin_reply, status, created_at, updated_at, responded_at, resolved_at, ip_address, user_agent, latitude, longitude, internal_notes";
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

  router.post("/", asyncHandler(async (req: any, res: any) => {
    const { name, department, phone, category, description, photo, face_photo, latitude, longitude, priority } = req.body;
    console.log('Incoming ticket data:', { name, department, phone, category, hasPhoto: !!photo, hasFacePhoto: !!face_photo, lat: latitude, lng: longitude });
    
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

    // Auto-mapping logic
    let assignedTo = 'yudha'; // Default
    const catInfo = db.prepare("SELECT assigned_to FROM categories WHERE name = ?").get(category) as { assigned_to: string } | undefined;
    if (catInfo && catInfo.assigned_to) {
      assignedTo = catInfo.assigned_to;
    }

    const info = db.prepare(
      "INSERT INTO tickets (ticket_no, name, department, phone, category, description, photo, face_photo, created_at, ip_address, user_agent, latitude, longitude, assigned_to, status, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(ticketNo, name, department, finalPhone, category, description || "", photo || null, face_photo || null, utcNow.toISOString(), String(ip), String(userAgent), latitude || null, longitude || null, assignedTo, 'New', priority || 'Medium');
    
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
  }));

  router.patch("/:id", asyncHandler(async (req: any, res: any) => {
    await handleTicketUpdate(req, res, io);
  }));

  router.put("/:id", asyncHandler(async (req: any, res: any) => {
    await handleTicketUpdate(req, res, io);
  }));

  router.post("/reset", asyncHandler(async (req: any, res: any) => {
    db.prepare("DELETE FROM tickets").run();
    res.json({ success: true });
  }));

  router.delete("/:id", asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    db.prepare("DELETE FROM tickets WHERE id = ?").run(id);
    res.json({ success: true });
  }));

  return router;
}

async function handleTicketUpdate(req: any, res: any, io: Server) {
  const { id } = req.params;
  const { status, assigned_to, admin_reply, internal_notes, takeover_by, reassign_to, performed_by, note, priority } = req.body;
  
  const currentTicket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(id) as Ticket | undefined;
  if (!currentTicket) throw new AppError("Ticket not found", 404);

  let respondedAt = currentTicket.responded_at;
  let resolvedAt = currentTicket.resolved_at;
  let newStatus = status !== undefined ? status : currentTicket.status;
  let newAssignedTo = assigned_to !== undefined ? assigned_to : currentTicket.assigned_to;
  let newPriority = priority !== undefined ? priority : currentTicket.priority;
  let newAdminReply = admin_reply !== undefined ? admin_reply : currentTicket.admin_reply;
  let newInternalNotes = internal_notes !== undefined ? internal_notes : currentTicket.internal_notes;

  const logs = [];

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

  if (!respondedAt && (admin_reply !== undefined || (newStatus !== 'New' && newStatus !== currentTicket.status))) {
    respondedAt = new Date().toISOString();
  }

  if (newStatus === 'Completed' && !resolvedAt) {
    resolvedAt = new Date().toISOString();
  } else if (newStatus !== 'Completed') {
    resolvedAt = null;
  }

  db.prepare("UPDATE tickets SET status = ?, assigned_to = ?, admin_reply = ?, internal_notes = ?, priority = ?, responded_at = ?, resolved_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(newStatus, newAssignedTo, newAdminReply, newInternalNotes, newPriority, respondedAt, resolvedAt, id);
  
  const insertLog = db.prepare("INSERT INTO ticket_logs (ticket_id, action, note, performed_by) VALUES (?, ?, ?, ?)");
  logs.forEach(log => {
    insertLog.run(id, log.action, log.note, log.performed_by);
  });

  if (newStatus === 'Completed' && currentTicket.status !== 'Completed') {
    const updatedTicket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(id) as Ticket;
    sendUserNotificationEmail(updatedTicket, 'done');
  }

  res.json({ success: true });
  io.emit("ticket_updated", { id, status: newStatus, assigned_to: newAssignedTo, priority: newPriority });
}
