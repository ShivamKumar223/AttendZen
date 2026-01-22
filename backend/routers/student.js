import express from "express";

// Import all required function 
import {showStudentDashboard, sendJoinRequest, showAttendanceDetails} from "../controllers/student.js";

const router = express.Router();

// To show student dashboard
router.get("/", showStudentDashboard);

// To send join request to teacher
router.post("/joinRequest", sendJoinRequest);

// To check attendance details
router.get("/attendanceDetails", showAttendanceDetails);


export default router;