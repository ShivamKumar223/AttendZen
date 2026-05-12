import express from "express";
import { notifyAttendance, submitAttendance, getClassAttendance, getStudentAttendance } from "../controllers/attendanceController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/notify", protect, notifyAttendance);
router.post("/submit", protect, submitAttendance);
router.get("/class/:classId", protect, getClassAttendance);
router.get("/student/:classId", protect, getStudentAttendance);

export default router;
