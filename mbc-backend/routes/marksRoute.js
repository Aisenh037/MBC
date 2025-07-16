import express from "express";
import {
  getMarks,
  addMark,
  updateMark,
  deleteMark
} from "../controllers/marksController.js";
import requireAuth from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

// Teacher/admin can add/update/delete marks; all can GET
router.get("/", requireAuth, getMarks);
router.post("/", requireAuth, requireRole(["teacher", "admin"]), addMark);
router.put("/:id", requireAuth, requireRole(["teacher", "admin"]), updateMark);
router.delete("/:id", requireAuth, requireRole(["teacher", "admin"]), deleteMark);

export default router;
