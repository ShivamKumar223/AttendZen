// backend/controllers/chatController.js

import ChatGroup from '../models/ChatGroup.js';
import Message from '../models/Message.js';
import storageService from '../utils/storageService.js';


// Helper: decide teacher authority from req.user.
// This codebase typically does not store `role` in JWT. If role isn't present,
// blocking routes will not work until you add teacher role info to JWT.
// For now we support both possible shapes.
const isTeacher = (req) => {
  const u = req.user;
  return !!(u && (u.role === 'teacher' || u.isTeacher === true));
};


// Create chat group for a class (called when a new class is created or on demand)
export const createChatGroup = async (req, res) => {
  try {
    const { classId } = req.body; // class identifier
    // Check if group already exists
    let group = await ChatGroup.findOne({ classId });
    if (group) return res.status(200).json({ group });

    // NOTE: model uses `blockedStudents` (schema). Keep fields aligned.
    group = new ChatGroup({ classId, blockedStudents: [] });

    await group.save();
    return res.status(201).json({ group });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create chat group' });
  }
};

// Teacher blocks a student from sending messages in a group
export const blockStudent = async (req, res) => {
  try {
    const { groupId, studentId } = req.body;
    if (!isTeacher(req)) return res.status(403).json({ error: 'Only teachers can block users' });
    const group = await ChatGroup.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    // Schema field is `blockedStudents`.
    if (!group.blockedStudents.includes(studentId)) {
      group.blockedStudents.push(studentId);
      await group.save();
    }
    res.status(200).json({ blocked: group.blockedStudents });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Block operation failed' });
  }
};

// Send a message (text or media)
export const sendMessage = async (req, res) => {
  try {
    const { groupId, content } = req.body;
    const senderId = req.user.id;
    const group = await ChatGroup.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    // Check block list
    if (group.blockedStudents && group.blockedStudents.includes(senderId)) {

      return res.status(403).json({ error: 'You are blocked from sending messages in this group' });
    }
    let mediaUrl = null;
    let mediaType = null;
    let originalFileName = null;

    if (req.file) {
      // store file using storage service
      mediaType = storageService.getMediaType(req.file.mimetype);
      originalFileName = req.file.originalname;
      mediaUrl = storageService.getFileUrl(req.file.filename);
    }

    const msg = new Message({
      group: groupId,
      sender: senderId,
      senderName: req.user.name || req.user.email || 'Unknown',
      content,
      mediaUrl,
      mediaType,
      originalFileName,
      createdAt: new Date(),
    });

    await msg.save();
    // Emit via Socket.io (req.io is attached in server.js)
    req.io.to(groupId).emit('new-message', msg);
    res.status(201).json({ message: msg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Delete a message – only allowed within 60 seconds and only by the author
export const deleteMessage = async (req, res) => {
  try {
    const { groupId, messageId } = req.params;
    const userId = req.user.id;
    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    if (msg.sender.toString() !== userId) {
      return res.status(403).json({ error: 'Only the author can delete this message' });
    }
    const now = new Date();
    const diffSec = (now - msg.createdAt) / 1000;
    if (diffSec > 60) {
      return res.status(403).json({ error: 'Deletion window (60s) has passed' });
    }
    await Message.findByIdAndDelete(messageId);
    req.io.to(groupId).emit('delete-message', messageId);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

// Export router-friendly wrappers (if using express Router)
export default {
  createChatGroup,
  blockStudent,
  sendMessage,
  deleteMessage,
};
