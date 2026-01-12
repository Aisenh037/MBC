import { Router } from 'express';
import {
    getAssignments,
    getAssignment,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    submitAssignment,
    gradeSubmission
} from '@/controllers/assignmentController';
import { protect, authorize } from '@/middleware/auth';

const router = Router();

// Public routes (none for assignments)

// Protected routes
router.use(protect);

// General assignment routes
router.route('/')
    .get(getAssignments)
    .post(authorize('admin', 'professor'), createAssignment);

router.route('/:id')
    .get(getAssignment)
    .put(authorize('admin', 'professor'), updateAssignment)
    .delete(authorize('admin', 'professor'), deleteAssignment);

// Submission routes
router.post('/:id/submit', authorize('student'), submitAssignment);
router.put('/:assignmentId/submissions/:submissionId/grade', authorize('admin', 'professor'), gradeSubmission);

export default router;