import express from "express";
import { getTeacherDashboard } from "../controllers/teacherDashboardController.js";
import requireAuth from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();
router.get("/", requireAuth, requireRole(["teacher"]), getTeacherDashboard);

export default router;
