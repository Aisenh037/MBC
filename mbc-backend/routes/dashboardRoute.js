import express from 'express';
import { getStudentDashboard, getProfessorDashboard } from '../controllers/dashboardController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All dashboard routes are protected
router.use(protect);

/**
 * Student dashboard (current logged-in student)
 * GET /api/v1/dashboards/student/me
 */
router.get('/student/me', authorize('student'), getStudentDashboard);

/**
 * Professor dashboard (current logged-in professor)
 * GET /api/v1/dashboards/professor/me
 */
router.get('/professor/me', authorize('professor'), getProfessorDashboard);

export default router;
