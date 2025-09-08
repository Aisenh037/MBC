// routes/assignmentRoute.js
import express from "express";
import {
  getAssignments,
  addAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  gradeSubmission,
  uploadAssignmentFile
} from "../controllers/assignmentController.js";
import protect from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";
import { uploadAssignmentFile as uploadMiddleware } from "../utils/fileUpload.js";

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getAssignments)
    .post(requireRole('teacher'), addAssignment);

router.route('/:id')
    .put(requireRole('teacher'), updateAssignment)
    .delete(requireRole('teacher'), deleteAssignment);

// Upload assignment file
router.post('/:id/upload', requireRole('teacher'), uploadMiddleware, uploadAssignmentFile);

router.post("/:id/submit", requireRole('student'), submitAssignment);
router.post("/:id/grade/:submissionId", requireRole('teacher'), gradeSubmission);

export default router;
