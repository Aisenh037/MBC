import express from "express";
import { getAnalytics } from "../controllers/analyticsController.js";
import requireAuth from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();
router.get("/", requireAuth, requireRole(["admin"]), getAnalytics);

export default router;
