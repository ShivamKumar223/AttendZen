import Attendance from "../models/Attendance.js";
import Class from "../models/Class.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

// @desc    Notify students about attendance (Confirm step)
// @route   POST /api/attendance/notify
// @access  Private
export const notifyAttendance = async (req, res) => {
  try {
    const { classId, date, records } = req.body;
    // records is an array: [{ studentId, status: 'present'/'absent' }]

    const classDoc = await Class.findById(classId);
    if (!classDoc) return res.status(404).json({ message: "Class not found" });

    // Emit to each student
    for (let record of records) {
      const msg = record.status === "present"
        ? `You are present in class ${classDoc.className}`
        : `You are not present in class ${classDoc.className}`;

      await Notification.create({ user: record.studentId, message: msg, type: "info" });
      req.io.to(record.studentId.toString()).emit("attendance-notification", {
        message: msg,
        classId,
        date,
      });
    }

    res.json({ message: "Notifications sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit final attendance
// @route   POST /api/attendance/submit
// @access  Private
export const submitAttendance = async (req, res) => {
  try {
    const { classId, date, records } = req.body;

    const classDoc = await Class.findById(classId);

    const formattedRecords = records.map(r => ({
      student: r.studentId,
      status: r.status
    }));

    // Upsert attendance for that date
    let attendance = await Attendance.findOne({ class: classId, date: new Date(date).setHours(0, 0, 0, 0) });

    if (attendance) {
      attendance.records = formattedRecords;
      attendance.isFinalized = true;
      await attendance.save();
    } else {
      attendance = await Attendance.create({
        class: classId,
        date: new Date(date).setHours(0, 0, 0, 0),
        records: formattedRecords,
        isFinalized: true
      });
    }

    // Send final notification
    for (let record of records) {
      const msg = record.status === "present"
        ? `Attendance Submitted: You are present in class ${classDoc.className}`
        : `Attendance Submitted: You are not present in class ${classDoc.className}`;

      await Notification.create({ user: record.studentId, message: msg, type: record.status === "present" ? "success" : "info" });
      req.io.to(record.studentId.toString()).emit("attendance-notification", {
        message: msg,
        classId,
        date,
      });
    }

    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get attendance for a class (Teacher view)
// @route   GET /api/attendance/class/:classId
// @access  Private
export const getClassAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({ class: req.params.classId })
      .populate("records.student", "name email mobile")
      .sort({ date: -1 });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get attendance for a student (Student view)
// @route   GET /api/attendance/student/:classId
// @access  Private
export const getStudentAttendance = async (req, res) => {
  try {
    const studentId = req.user.id;
    const classId = req.params.classId;

    const attendance = await Attendance.find({ class: classId })
      .sort({ date: -1 });

    const studentRecords = attendance.map(att => {
      const record = att.records.find(r => r.student.toString() === studentId);
      return {
        date: att.date,
        status: record ? record.status : "pending"
      };
    });

    res.json(studentRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
