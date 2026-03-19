import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { initDb } from "./server/db.js";
import { globalErrorHandler } from "./server/utils/errors.js";

// Import routes
import authRouter from "./server/routes/auth.js";
import ticketsRouter from "./server/routes/tickets.js";
import assetsRouter from "./server/routes/assets.js";
import masterDataRouter from "./server/routes/masterData.js";
import imagesRouter from "./server/routes/images.js";
import settingsRouter from "./server/routes/settings.js";

async function startServer() {
  console.log("Starting server initialization...");
  
  // Initialize database
  initDb();

  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  const PORT = 3000;

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  // Middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(cors());

  // Request logging middleware
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      console.log(`${new Date().toISOString()} - [API REQUEST] ${req.method} ${req.url}`);
    }
    next();
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Test route
  app.get("/api/test", (req, res) => {
    res.json({ message: "API is working" });
  });

  // Mount routes
  app.use("/api", authRouter);
  app.use("/api/tickets", ticketsRouter(io));
  app.use("/api/assets", assetsRouter);
  app.use("/api", masterDataRouter);
  app.use("/api/images", imagesRouter);
  app.use("/", settingsRouter);

  // Catch-all for API routes
  app.all("/api/*", (req, res) => {
    console.warn(`[API 404] ${req.method} ${req.url}`);
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  // Global Error Handler (MUST BE LAST)
  app.use(globalErrorHandler);

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`SERVER IS LISTENING ON 0.0.0.0:${PORT}`);
    console.log(`Server initialization complete.`);
  });
}

startServer();
