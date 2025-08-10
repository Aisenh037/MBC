// routes/analyticsRoute.js
import express from "express";
import { getAnalytics } from "../controllers/analyticsController.js";
import protect from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.get("/", protect, requireRole('admin'), getAnalytics);

export default router;