import express from "express";
import { protect } from "../middleware/auth.js";
import { createChatGroup, blockStudent, sendMessage, deleteMessage } from "../controllers/chatController.js";
import ChatGroup from "../models/ChatGroup.js";
import Message from "../models/Message.js";
import storageService from "../utils/storageService.js";

const router = express.Router();

// Ensure we always have a chat group for a class
// GET /api/chat/groups/:classId
router.get("/groups/:classId", protect, async (req, res) => {
  try {
    const { classId } = req.params;
    let group = await ChatGroup.findOne({ classId });
    if (!group) {
      group = await ChatGroup.create({ classId, blockedStudents: [] });
    }

    res.json({ group });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get chat group" });
  }
});

// POST /api/chat/groups  (create/get)
router.post("/groups", protect, createChatGroup);

// GET messages for a group (paginated)
// GET /api/chat/groups/:groupId/messages?page=1&limit=50
router.get("/groups/:groupId/messages", protect, async (req, res) => {
  try {
    const { groupId } = req.params;
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "30", 10), 1), 100);
    const skip = (page - 1) * limit;

    const messages = await Message.find({ group: groupId, isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ messages, page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Send message (text + optional media)
// POST /api/chat/groups/:groupId/messages
// multipart/form-data: { content, file }
router.post(
  "/groups/:groupId/messages",
  protect,
  storageService.multerUpload.single("file"),
  async (req, res) => {
    try {
      const { groupId } = req.params;
      // controller expects req.body.groupId and req.body.content
      req.body.groupId = groupId;
      await sendMessage(req, res);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to send message" });
    }
  }
);

// Delete message
// DELETE /api/chat/groups/:groupId/messages/:messageId
router.delete(
  "/groups/:groupId/messages/:messageId",
  protect,
  async (req, res) => {
    // controller expects req.params.groupId and req.params.messageId
    await deleteMessage(req, res);
  }
);

// Teacher blocks student
// POST /api/chat/groups/:groupId/block
// body: { studentId }
router.post("/groups/:groupId/block", protect, async (req, res) => {
  try {
    const { groupId } = req.params;
    req.body.groupId = groupId;
    await blockStudent(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to block student" });
  }
});

export default router;

