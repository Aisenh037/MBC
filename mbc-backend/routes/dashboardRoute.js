import express from 'express';
import { getStudentDashboard } from '../controllers/dashboardController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes in this file are protected
router.use(protect);

// This route is specifically for the logged-in student to get their own data
router.get('/student/me', authorize('student'), getStudentDashboard);

// You can add a similar route for professors
// router.get('/professor/me', authorize('professor'), getProfessorDashboard);

export default router;