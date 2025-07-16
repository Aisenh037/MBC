import express from "express";
import {
  getAssignments,
  addAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  gradeSubmission
} from "../controllers/assignmentController.js";
import requireAuth from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

// Teachers: CRUD assignments
router.get("/", requireAuth, getAssignments);
router.post("/", requireAuth, requireRole(["teacher"]), addAssignment);
router.put("/:id", requireAuth, requireRole(["teacher"]), updateAssignment);
router.delete("/:id", requireAuth, requireRole(["teacher"]), deleteAssignment);

// Students: submit assignment
router.post("/:id/submit", requireAuth, requireRole(["student"]), submitAssignment);

// Teachers: grade submission
router.post("/:id/grade/:submissionId", requireAuth, requireRole(["teacher"]), gradeSubmission);

export default router;
