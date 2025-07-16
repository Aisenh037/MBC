import express from "express";
import { getStudentDashboard } from "../controllers/studentDashboardController.js";
import requireAuth from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();
router.get("/", requireAuth, requireRole(["student"]), getStudentDashboard);

export default router;
