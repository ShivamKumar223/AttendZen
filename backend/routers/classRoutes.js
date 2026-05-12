import express from "express";
import { createClass, getUserClasses, searchClass } from "../controllers/classController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.route("/").post(protect, createClass).get(protect, getUserClasses);
router.get("/search", protect, searchClass);

export default router;
