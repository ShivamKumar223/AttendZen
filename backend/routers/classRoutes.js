import express from "express";
import {
  createClass,
  getUserClasses,
  searchClass,
  removeStudent,
  deleteClass,
} from "../controllers/classController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.route("/").post(protect, createClass).get(protect, getUserClasses);
router.get("/search", protect, searchClass);
router.delete("/:classId", protect, deleteClass);
router.delete("/:classId/students/:studentId", protect, removeStudent);

export default router;
