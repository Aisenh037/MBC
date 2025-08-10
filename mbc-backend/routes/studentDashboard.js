// routes/studentDashboardRoute.js
import express from "express";
import { getStudentDashboard } from "../controllers/studentDashboardController.js";
import protect from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.get("/", protect, requireRole('student'), getStudentDashboard);

export default router;