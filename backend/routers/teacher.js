import express from "express";

// import controller means all functiions
import {showTeacherDashboard, createNewClass, updateClassDetails, deleteClass, markAttendance,
    retriveDetails, retriveStudentsAtDate, retriveAllStudensts, 
    updateAttendance, removeStudentFromClass
} from "../controllers/teacher.js";

const router = express.Router();

// To show teacher dashboard
router.get("/", showTeacherDashboard)

// To create new class
router.post("/createNewClass", createNewClass);

// To update class detail
router.patch("/update/:class", updateClassDetails);

// To delete class 
router.delete("/delete/:class", deleteClass)

// To mark attendance
router.post("/markAttendance", markAttendance);

// To retrive attendance details for a particular student
router.get("/attendanceDetails/:rollOrName", retriveDetails);

// To retrive all students which present at particular date
router.get("/studentsAtDate/:date", retriveStudentsAtDate);

// Retrive all students in a particular class
router.get("/studentsInClass/:class", retriveAllStudensts);

// To update/edit attendance
router.patch("/updateAttendance", updateAttendance);

// To remove student from class
router.delete("/remove/:student", removeStudentFromClass);

export default router;