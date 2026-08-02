import { Router } from "express";
import { Server } from "socket.io";
import db from "../db.ts";

export default function teamLocationRouter(io?: Server) {
  const router = Router();

  // GET /api/team-location - Get all current team locations
  router.get("/", (req, res) => {
    try {
      const locations = db.prepare(`
        SELECT 
          tl.*,
          u.role as user_role,
          u.full_name as user_full_name
        FROM team_locations tl
        LEFT JOIN users u ON LOWER(u.username) = LOWER(tl.username)
        ORDER BY tl.updated_at DESC
      `).all();

      res.json(locations);
    } catch (err: any) {
      console.error("Error fetching team locations:", err);
      res.status(500).json({ error: "Gagal mengambil data lokasi tim." });
    }
  });

  // POST /api/team-location/update - Update location from Web browser or manual Check-In
  router.post("/update", (req, res) => {
    try {
      const {
        username,
        full_name,
        role,
        latitude,
        longitude,
        accuracy,
        battery_level,
        speed,
        address,
        provider = 'web',
        note = ''
      } = req.body;

      if (!username || latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: "Username, latitude, dan longitude wajib diisi." });
      }

      const normUser = String(username).toLowerCase().trim();
      
      // Lookup user full_name and role if missing
      let nameToUse = full_name;
      let roleToUse = role;

      const userRow = db.prepare("SELECT username, full_name, role FROM users WHERE LOWER(username) = ?").get(normUser) as any;
      if (userRow) {
        nameToUse = nameToUse || userRow.full_name || normUser;
        roleToUse = roleToUse || userRow.role || 'Team Member';
      } else {
        nameToUse = nameToUse || normUser;
        roleToUse = roleToUse || 'IT Support';
      }

      const existing = db.prepare("SELECT id FROM team_locations WHERE LOWER(username) = ?").get(normUser) as any;

      const nowIso = new Date().toISOString();

      if (existing) {
        db.prepare(`
          UPDATE team_locations
          SET 
            full_name = ?,
            role = ?,
            latitude = ?,
            longitude = ?,
            accuracy = ?,
            battery_level = ?,
            speed = ?,
            address = ?,
            provider = ?,
            note = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(
          nameToUse,
          roleToUse,
          latitude,
          longitude,
          accuracy || 10,
          battery_level !== undefined ? battery_level : 80,
          speed || 0,
          address || '',
          provider,
          note || '',
          existing.id
        );
      } else {
        db.prepare(`
          INSERT INTO team_locations 
          (username, full_name, role, latitude, longitude, accuracy, battery_level, speed, address, provider, note)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          normUser,
          nameToUse,
          roleToUse,
          latitude,
          longitude,
          accuracy || 10,
          battery_level !== undefined ? battery_level : 80,
          speed || 0,
          address || '',
          provider,
          note || ''
        );
      }

      // Insert history log
      db.prepare(`
        INSERT INTO team_location_logs
        (username, full_name, latitude, longitude, accuracy, battery_level, speed, provider, address, note)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        normUser,
        nameToUse,
        latitude,
        longitude,
        accuracy || 10,
        battery_level !== undefined ? battery_level : 80,
        speed || 0,
        provider,
        address || '',
        note || ''
      );

      // Emit socket notification if io is active
      if (io) {
        io.emit("team_location_updated", {
          username: normUser,
          full_name: nameToUse,
          latitude,
          longitude,
          updated_at: nowIso,
          provider
        });
      }

      res.json({ success: true, message: "Lokasi berhasil diperbarui." });
    } catch (err: any) {
      console.error("Error updating team location:", err);
      res.status(500).json({ error: "Gagal memperbarui lokasi." });
    }
  });

  // GET & POST /api/team-location/traccar - Traccar Client OsmAnd / HTTP protocol endpoint
  const handleTraccarUpdate = (req: any, res: any) => {
    try {
      const params = { ...req.query, ...req.body };
      
      const deviceId = params.id || params.deviceid;
      const lat = parseFloat(params.lat || params.latitude);
      const lon = parseFloat(params.lon || params.lng || params.longitude);
      const batt = params.batt !== undefined ? parseFloat(params.batt) : 85;
      const speed = params.speed ? parseFloat(params.speed) : 0;
      const hdop = params.hdop ? parseFloat(params.hdop) : 10;

      if (!deviceId || isNaN(lat) || isNaN(lon)) {
        return res.status(400).send("INVALID PARAMS");
      }

      const normUser = String(deviceId).toLowerCase().trim();
      const userRow = db.prepare("SELECT username, full_name, role FROM users WHERE LOWER(username) = ? OR LOWER(full_name) LIKE ?").get(normUser, `%${normUser}%`) as any;

      const nameToUse = userRow ? userRow.full_name : deviceId;
      const roleToUse = userRow ? userRow.role : "IT Support";
      const resolvedUsername = userRow ? userRow.username : normUser;

      const existing = db.prepare("SELECT id FROM team_locations WHERE LOWER(username) = ?").get(resolvedUsername) as any;

      const addressText = `Update Traccar Client GPS (${lat.toFixed(5)}, ${lon.toFixed(5)})`;
      const nowIso = new Date().toISOString();

      if (existing) {
        db.prepare(`
          UPDATE team_locations
          SET 
            full_name = ?,
            role = ?,
            latitude = ?,
            longitude = ?,
            accuracy = ?,
            battery_level = ?,
            speed = ?,
            address = ?,
            provider = 'traccar',
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(nameToUse, roleToUse, lat, lon, hdop, batt, speed, addressText, existing.id);
      } else {
        db.prepare(`
          INSERT INTO team_locations
          (username, full_name, role, latitude, longitude, accuracy, battery_level, speed, address, provider, note)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'traccar', 'Koneksi Otomatis Traccar Client')
        `).run(resolvedUsername, nameToUse, roleToUse, lat, lon, hdop, batt, speed, addressText);
      }

      db.prepare(`
        INSERT INTO team_location_logs
        (username, full_name, latitude, longitude, accuracy, battery_level, speed, provider, address, note)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'traccar', ?, 'Background GPS Tracking')
      `).run(resolvedUsername, nameToUse, lat, lon, hdop, batt, speed, addressText);

      if (io) {
        io.emit("team_location_updated", {
          username: resolvedUsername,
          full_name: nameToUse,
          latitude: lat,
          longitude: lon,
          updated_at: nowIso,
          provider: 'traccar'
        });
      }

      // Traccar Client expects HTTP 200 OK
      res.status(200).send("OK");
    } catch (err: any) {
      console.error("Traccar endpoint error:", err);
      res.status(500).send("ERROR");
    }
  };

  router.get("/traccar", handleTraccarUpdate);
  router.post("/traccar", handleTraccarUpdate);

  // GET /api/team-location/logs - Location history
  router.get("/logs", (req, res) => {
    try {
      const username = req.query.username ? String(req.query.username).toLowerCase().trim() : '';
      let logs;
      if (username) {
        logs = db.prepare(`
          SELECT * FROM team_location_logs 
          WHERE LOWER(username) = ? 
          ORDER BY created_at DESC 
          LIMIT 50
        `).all(username);
      } else {
        logs = db.prepare(`
          SELECT * FROM team_location_logs 
          ORDER BY created_at DESC 
          LIMIT 100
        `).all();
      }
      res.json(logs);
    } catch (err: any) {
      console.error("Error fetching location logs:", err);
      res.status(500).json({ error: "Gagal mengambil log lokasi." });
    }
  });

  return router;
}
