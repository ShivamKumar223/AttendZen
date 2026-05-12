import express from "express";
import dotenv from "dotenv";
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

dotenv.config();
DBconnection(); // 🔥 Atlas connection

const app = express();
app.use(cors());
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

// API Routes
app.use("https://attendzen.onrender.com/api/auth", authRoutes);
app.use("https://attendzen.onrender.com/api/classes", classRoutes);
app.use("https://attendzen.onrender.com/api/requests", requestRoutes);
app.use("https://attendzen.onrender.com/api/attendance", attendanceRoutes);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
