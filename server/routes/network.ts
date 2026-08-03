import express from "express";
import db from "../db.ts";
import ping from "ping";
import mysql from "mysql2/promise";
import { createRequire } from "module";
import path from "path";

// Dynamically resolve auth_plugins to avoid ERR_PACKAGE_PATH_NOT_EXPORTED in Node's strict ESM exports checking
const getPlugins = () => {
  try {
    const req = createRequire(import.meta.url);
    const mysql2Dir = path.dirname(req.resolve("mysql2/package.json"));
    return {
      caching_sha2_password: req(path.join(mysql2Dir, "lib/auth_plugins/caching_sha2_password.js")),
      mysql_native_password: req(path.join(mysql2Dir, "lib/auth_plugins/mysql_native_password.js")),
      sha256_password: req(path.join(mysql2Dir, "lib/auth_plugins/sha256_password.js")),
    };
  } catch (e) {
    try {
      const glob = globalThis as any;
      const req = glob.require || (typeof require !== "undefined" ? require : null);
      if (req) {
        const mysql2Dir = path.dirname(req.resolve("mysql2/package.json"));
        return {
          caching_sha2_password: req(path.join(mysql2Dir, "lib/auth_plugins/caching_sha2_password.js")),
          mysql_native_password: req(path.join(mysql2Dir, "lib/auth_plugins/mysql_native_password.js")),
          sha256_password: req(path.join(mysql2Dir, "lib/auth_plugins/sha256_password.js")),
        };
      }
    } catch (err) {
      console.error("Failed to dynamically load mysql2 plugins via glob.require:", err);
    }
    throw e;
  }
};

const plugins = getPlugins();
const caching_sha2_password = plugins.caching_sha2_password;
const mysql_native_password = plugins.mysql_native_password;
const sha256_password = plugins.sha256_password;

const router = express.Router();

// Get all network devices
router.get("/devices", (req, res) => {
  try {
    const devices = db.prepare("SELECT * FROM network_devices ORDER BY type, name").all();
    res.json(devices);
  } catch (error) {
    console.error("Error fetching network devices:", error);
    res.status(500).json({ error: "Failed to fetch network devices" });
  }
});

// Add a new device
router.post("/devices", (req, res) => {
  try {
    const { name, ip_address, type, location } = req.body;
    
    if (!name || !ip_address || !type) {
      return res.status(400).json({ error: "Name, IP address, and type are required" });
    }

    const result = db.prepare(`
      INSERT INTO network_devices (name, ip_address, type, location, status) 
      VALUES (?, ?, ?, ?, 'Unknown')
    `).run(name, ip_address, type, location || null);

    const newDevice = db.prepare("SELECT * FROM network_devices WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(newDevice);
  } catch (error: any) {
    console.error("Error adding network device:", error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: "IP Address already exists in monitoring list" });
    }
    res.status(500).json({ error: "Failed to add network device" });
  }
});

// Add multiple devices
router.post("/devices/bulk", (req, res) => {
  try {
    const devices = req.body.devices;
    
    if (!Array.isArray(devices)) {
      return res.status(400).json({ error: "Devices array is required" });
    }

    const insertStmt = db.prepare(`
      INSERT INTO network_devices (name, ip_address, type, location, status) 
      VALUES (?, ?, ?, ?, 'Unknown')
      ON CONFLICT(ip_address) DO UPDATE SET
        name = excluded.name,
        type = excluded.type,
        location = excluded.location
    `);

    const insertMany = db.transaction((devicesList) => {
      let count = 0;
      for (const device of devicesList) {
        if (device.ip_address && device.name && device.type) {
          const result = insertStmt.run(device.name, device.ip_address, device.type, device.location || null);
          if (result.changes > 0) count++;
        }
      }
      return count;
    });

    const addedCount = insertMany(devices);
    res.status(201).json({ success: true, count: addedCount });
  } catch (error: any) {
    console.error("Error bulk adding network devices:", error);
    res.status(500).json({ error: "Failed to bulk add network devices" });
  }
});

// Update a device
router.put("/devices/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { name, ip_address, type, location } = req.body;
    
    db.prepare(`
      UPDATE network_devices 
      SET name = ?, ip_address = ?, type = ?, location = ?
      WHERE id = ?
    `).run(name, ip_address, type, location || null, id);

    const updatedDevice = db.prepare("SELECT * FROM network_devices WHERE id = ?").get(id);
    res.json(updatedDevice);
  } catch (error: any) {
    console.error("Error updating network device:", error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: "IP Address already exists" });
    }
    res.status(500).json({ error: "Failed to update network device" });
  }
});

// Delete a device
router.delete("/devices/:id", (req, res) => {
  try {
    const { id } = req.params;
    db.prepare("DELETE FROM network_devices WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting network device:", error);
    res.status(500).json({ error: "Failed to delete network device" });
  }
});

// Scan all devices (Ping)
router.post("/scan", async (req, res) => {
  try {
    const devices = db.prepare("SELECT * FROM network_devices").all() as any[];
    const updateStmt = db.prepare("UPDATE network_devices SET status = ?, last_checked = CURRENT_TIMESTAMP WHERE id = ?");
    
    // We can ping in parallel for faster results
    const pingPromises = devices.map(async (device) => {
      try {
        const res = await ping.promise.probe(device.ip_address, {
          timeout: 2,
          extra: ['-c', '1']
        });
        const status = res.alive ? 'Online' : 'Offline';
        
        // Update DB
        updateStmt.run(status, device.id);
        
        return {
          id: device.id,
          ip_address: device.ip_address,
          status,
          time: res.time
        };
      } catch (err) {
        updateStmt.run('Offline', device.id);
        return {
          id: device.id,
          ip_address: device.ip_address,
          status: 'Offline',
          time: null
        };
      }
    });

    const results = await Promise.all(pingPromises);
    
    res.json({ success: true, results });
  } catch (error) {
    console.error("Error scanning devices:", error);
    res.status(500).json({ error: "Failed to scan devices" });
  }
});

// Test MySQL database connection
router.post("/test-db-connection", async (req, res) => {
  const { host, port, user, password, database } = req.body;
  
  if (!host || !user) {
    return res.status(400).json({ success: false, error: "Host dan User wajib diisi." });
  }

  try {
    console.log(`[DB TEST] Menghubungi MySQL di ${host}:${port || 3306} as ${user}...`);
    const connection = await mysql.createConnection({
      host,
      port: Number(port || 3306),
      user,
      password: password || '',
      database: database || undefined,
      connectTimeout: 3000, // 3 seconds timeout
      allowPublicKeyRetrieval: true, // Sangat penting untuk MySQL 8+ dengan caching_sha2_password / sha256_password
      authPlugins: {
        '': caching_sha2_password,
        'caching_sha2_password': caching_sha2_password,
        'mysql_native_password': mysql_native_password,
        'sha256_password': sha256_password
      }
    } as any);
    
    // Ping connection
    await connection.ping();
    await connection.end();
    
    console.log(`[DB TEST] Berhasil terhubung ke ${host}!`);
    res.json({ success: true, message: `Terhubung sukses ke database MySQL di ${host}:${port || 3306}` });
  } catch (error: any) {
    console.error("[DB TEST] Gagal terhubung:", error);
    res.json({ 
      success: false, 
      error: error.message || "Gagal menghubungkan ke database MySQL. Periksa IP, Port, Username, atau Password Anda." 
    });
  }
});

export default router;
