import express from "express";
import {
  getNotices,
  addNotice,
  updateNotice,
  deleteNotice
} from "../controllers/noticeController.js";
import requireAuth from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

// All roles can read; only admin/teacher can create/update/delete
router.get("/", requireAuth, getNotices);
router.post("/", requireAuth, requireRole(["admin", "teacher"]), addNotice);
router.put("/:id", requireAuth, requireRole(["admin", "teacher"]), updateNotice);
router.delete("/:id", requireAuth, requireRole(["admin", "teacher"]), deleteNotice);

export default router;
