import express from 'express';
import {
  createAssignment,
  submitAssignment,
  gradeAssignment,
} from '../controllers/assignment.js';

import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router
  .route('/')
  .post(protect, authorize('professor', 'hod', 'director', 'creator'), createAssignment);

router
  .route('/:id/submit')
  .put(protect, authorize('student'), submitAssignment);

router
  .route('/:id/grade/:submissionId')
  .put(protect, authorize('professor', 'hod', 'director', 'creator'), gradeAssignment);

export default router;
