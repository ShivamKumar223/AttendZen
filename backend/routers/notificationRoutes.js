import express from "express";
import { getNotifications, deleteNotification } from "../controllers/notificationController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, getNotifications);
router.delete("/:id", protect, deleteNotification);

export default router;
