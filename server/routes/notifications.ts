import express from "express";
import db from "../db.ts";
import { Server } from "socket.io";
import { asyncHandler } from "../utils/asyncHandler.ts";

export default function(io: Server) {
  const router = express.Router();

  // GET /api/notifications
  router.get("/", asyncHandler(async (req: any, res: any) => {
    const { employee_index, name, ticket_no, limit } = req.query;
    const maxLimit = parseInt(limit || '50', 10);

    let sql = "SELECT * FROM notifications WHERE 1=1";
    const params: any[] = [];

    if (ticket_no) {
      sql += " AND ticket_no = ?";
      params.push(ticket_no);
    } else if (employee_index && employee_index !== 'undefined') {
      sql += " AND (employee_index = ? OR recipient_name LIKE ?)";
      params.push(employee_index, `%${name || ''}%`);
    } else if (name && name !== 'undefined') {
      sql += " AND recipient_name LIKE ?";
      params.push(`%${name}%`);
    }

    sql += " ORDER BY created_at DESC LIMIT ?";
    params.push(maxLimit);

    const notifications = db.prepare(sql).all(...params);
    res.json(notifications);
  }));

  // POST /api/notifications/read
  router.post("/read", asyncHandler(async (req: any, res: any) => {
    const { id, employee_index, name, all } = req.body;

    if (id) {
      db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(id);
    } else if (all) {
      if (employee_index) {
        db.prepare("UPDATE notifications SET is_read = 1 WHERE employee_index = ? OR recipient_name = ?").run(employee_index, name || employee_index);
      } else {
        db.prepare("UPDATE notifications SET is_read = 1").run();
      }
    }

    res.json({ success: true });
  }));

  return router;
}
