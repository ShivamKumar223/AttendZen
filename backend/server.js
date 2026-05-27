import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

// To connect mongodb atlas 
import { DBconnection } from "./config/db.js";

// Routes
import authRoutes from "./routers/authRoutes.js";
import classRoutes from "./routers/classRoutes.js";
import requestRoutes from "./routers/requestRoutes.js";
import attendanceRoutes from "./routers/attendanceRoutes.js";
import notificationRoutes from "./routers/notificationRoutes.js";
import chatRoutes from "./routers/chatRoutes.js";

dotenv.config();

DBconnection(); // 🔥 Atlas connection

const app = express();
app.use(cors({
  origin: ['http://localhost:5173', 'https://smart-attendzen.netlify.app'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup HTTP server for socket.io
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Adjust later for production
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Socket.IO Logic
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // User joins their personal room to receive personal notifications
  socket.on("join-personal-room", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their personal room`);
  });

  // User joins a class room (e.g. for dynamic group chat or class-wide events)
  socket.on("join-class-room", (classId) => {
    socket.join(classId);
    console.log(`Socket ${socket.id} joined class room ${classId}`);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Attach socket io instance to req so controllers can use it
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Serve uploaded media (images/pdfs) for chat
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));





// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);


const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
