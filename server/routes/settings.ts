import { Router } from "express";
import db from "../db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/errors.js";

const router = Router();

router.get("/api/settings", asyncHandler(async (req, res) => {
  const settings = db.prepare("SELECT * FROM settings").all();
  const settingsObj = settings.reduce((acc: any, curr: any) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});
  res.json(settingsObj);
}));

router.patch("/api/settings", asyncHandler(async (req, res) => {
  const body = req.body;
  const update = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
  Object.entries(body).forEach(([key, value]) => {
    update.run(key, value !== null && value !== undefined ? String(value) : null);
  });
  res.json({ success: true });
}));

router.post("/api/settings", asyncHandler(async (req, res) => {
  const body = req.body;
  const update = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
  Object.entries(body).forEach(([key, value]) => {
    update.run(key, value !== null && value !== undefined ? String(value) : null);
  });
  res.json({ success: true });
}));

router.get("/api/branding/logo", asyncHandler(async (req, res) => {
  const logo = db.prepare("SELECT value FROM settings WHERE key = 'custom_logo'").get() as { value: string } | undefined;
  if (logo && logo.value) {
    const base64Data = logo.value.replace(/^data:image\/\w+;base64,/, "");
    const img = Buffer.from(base64Data, 'base64');
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': img.length
    });
    res.end(img);
  } else {
    res.redirect("https://cdn-icons-png.flaticon.com/512/2906/2906274.png");
  }
}));

router.get("/api/branding/favicon", asyncHandler(async (req, res) => {
  const favicon = db.prepare("SELECT value FROM settings WHERE key = 'custom_favicon'").get() as { value: string } | undefined;
  if (favicon && favicon.value) {
    const base64Data = favicon.value.replace(/^data:image\/\w+;base64,/, "");
    const img = Buffer.from(base64Data, 'base64');
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': img.length
    });
    res.end(img);
  } else {
    res.redirect("https://cdn-icons-png.flaticon.com/512/2906/2906274.png");
  }
}));

router.get("/manifest.json", asyncHandler(async (req, res) => {
  const settings = db.prepare("SELECT * FROM settings").all();
  const s = settings.reduce((acc: any, curr: any) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});

  const version = req.query.v || Date.now();
  const manifest = {
    name: s.app_name || "IT Helpdesk K3DK",
    short_name: (s.app_name || "IT Helpdesk").split(' ')[0],
    description: "Professional IT Helpdesk Ticketing System",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: s.primary_color || "#10b981",
    icons: [
      {
        src: `/api/branding/logo?v=${version}`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: `/api/branding/logo?v=${version}`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ],
    shortcuts: [
      {
        name: "Buat Tiket",
        short_name: "Buat",
        description: "Buat tiket bantuan baru",
        url: "/?action=create",
        icons: [{ src: `/api/branding/logo?v=${version}`, sizes: "192x192" }]
      },
      {
        name: "Cek Status",
        short_name: "Status",
        description: "Cek status tiket saya",
        url: "/?action=status",
        icons: [{ src: `/api/branding/logo?v=${version}`, sizes: "192x192" }]
      }
    ]
  };
  res.json(manifest);
}));

export default router;
