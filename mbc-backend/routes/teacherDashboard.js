// routes/teacherDashboardRoute.js
import express from "express";
import { getTeacherDashboard } from "../controllers/teacherDashboardController.js";
import protect from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.get("/", protect, requireRole('professor'), getTeacherDashboard);

export default router;