import express from "express";
import { sendJoinRequest, getTeacherRequests, respondToRequest } from "../controllers/requestController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, sendJoinRequest);
router.get("/:classId", protect, getTeacherRequests);
router.put("/:requestId", protect, respondToRequest);

export default router;
