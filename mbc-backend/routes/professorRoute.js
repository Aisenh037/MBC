import express from "express";
import {
  getTeachers,
  addTeacher,
  updateTeacher,
  deleteTeacher
} from "../controllers/professorController.js";
import requireAuth from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.get("/", requireAuth, requireRole(["admin"]), getTeachers);
router.post("/", requireAuth, requireRole(["admin"]), addTeacher);
router.put("/:id", requireAuth, requireRole(["admin"]), updateTeacher);
router.delete("/:id", requireAuth, requireRole(["admin"]), deleteTeacher);

export default router;
