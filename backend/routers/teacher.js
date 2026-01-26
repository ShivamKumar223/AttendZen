import express from "express";

// import controller means all functiions
import {showTeacherDashboard, createNewClass, updateClassDetails, deleteClass, markAttendance,
    retriveAttendanceDetails, retriveStudentsAtDate, retriveAllStudensts, 
    updateAttendance, removeStudentFromClass
} from "../controllers/teacher.js";

const router = express.Router();

// To show teacher dashboard
router.get("/", showTeacherDashboard)

// To create new class
router.post("/createNewClass", createNewClass);

// To update class detail
router.patch("/update/:classId", updateClassDetails);

// To delete class 
router.delete("/delete/:classId", deleteClass)

// Retrive all students in a particular class
router.get("/studentsInClass/:classId", retriveAllStudensts);

// To mark attendance
router.patch("/markAttendance", markAttendance);

// To retrive attendance details for a particular student
router.get("/attendanceDetails/:classId/:userId", retriveAttendanceDetails);

// To remove student from class
router.delete("/remove/:classId/:userId", removeStudentFromClass);




// Pending : 

// To retrive all students which present at particular date
router.get("/studentsAtDate/:date", retriveStudentsAtDate);

// To update/edit attendance
router.patch("/updateAttendance", updateAttendance);


export default router;