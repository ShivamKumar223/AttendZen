import JoinRequest from "../models/JoinRequest.js";
import Class from "../models/Class.js";
import Notification from "../models/Notification.js";

// @desc    Send a join request to a class
// @route   POST /api/requests
// @access  Private
export const sendJoinRequest = async (req, res) => {
  try {
    const { classId, rollNo } = req.body; // Actually class Code from client

    const foundClass = await Class.findOne({ classCode: classId });
    if (!foundClass) return res.status(404).json({ message: "Class not found" });

    // Block the class creator from joining their own class
    if (foundClass.teacher.toString() === req.user.id) {
      return res.status(403).json({ message: "You cannot join a class you created." });
    }

    // Check if already requested or enrolled
    const existingRequest = await JoinRequest.findOne({ student: req.user.id, class: foundClass._id });
    if (existingRequest) return res.status(400).json({ message: "Request already sent" });

    if (foundClass.students.some(s => s.student.toString() === req.user.id)) {
      return res.status(400).json({ message: "Already enrolled in class" });
    }

    const request = await JoinRequest.create({
      student: req.user.id,
      class: foundClass._id,
      rollNo,
    });

    // Notify teacher via Socket.IO & DB
    const message = `${req.user.name} has requested to join ${foundClass.className}`;
    await Notification.create({ user: foundClass.teacher, message, type: "info" });
    req.io.to(foundClass.teacher.toString()).emit("new-join-request", {
      message,
      classId: foundClass._id,
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get join requests for a teacher's classes
// @route   GET /api/requests/:classId
// @access  Private
export const getTeacherRequests = async (req, res) => {
  try {
    const requests = await JoinRequest.find({ class: req.params.classId, status: "pending" })
      .populate("student", "name email mobile");

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Respond to join request (accept/reject)
// @route   PUT /api/requests/:requestId
// @access  Private
export const respondToRequest = async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' or 'rejected'
    const request = await JoinRequest.findById(req.params.requestId).populate("class");

    if (!request) return res.status(404).json({ message: "Request not found" });

    request.status = status;
    await request.save();

    if (status === "accepted") {
      const classDoc = await Class.findById(request.class._id);
      classDoc.students.push({ student: request.student, rollNo: request.rollNo });
      await classDoc.save();
    }

    // Notify student via Socket.IO & DB
    const message = `Your request to join ${request.class.className} was ${status}`;
    await Notification.create({ user: request.student, message, type: status === "accepted" ? "success" : "error" });
    req.io.to(request.student.toString()).emit("request-response", {
      message,
      status,
      classId: request.class._id,
    });

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
