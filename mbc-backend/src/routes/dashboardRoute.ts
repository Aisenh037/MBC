import { Router } from 'express';
import { protect, authorize } from '@/middleware/auth';
import { dashboardCache } from '@/middleware/cache';
import {
  getStudentDashboard,
  getProfessorDashboard,
  getAdminDashboard,
} from '@/controllers/dashboardController';

const router = Router();

// All dashboard routes are protected
router.use(protect);

/**
 * @swagger
 * /api/v1/dashboard/student/me:
 *   get:
 *     summary: Get student dashboard data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     enrolledCourses:
 *                       type: integer
 *                     totalAssignments:
 *                       type: integer
 *                     submittedAssignments:
 *                       type: integer
 *                     upcomingDeadlines:
 *                       type: array
 *                       items:
 *                         type: object
 *                     recentGrades:
 *                       type: array
 *                       items:
 *                         type: object
 *                     notifications:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.get('/student/me', 
  authorize('student'),
  dashboardCache(), // Cache dashboard data for 5 minutes
  getStudentDashboard
);

/**
 * @swagger
 * /api/v1/dashboard/professor/me:
 *   get:
 *     summary: Get professor dashboard data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Professor dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalCourses:
 *                       type: integer
 *                     totalStudents:
 *                       type: integer
 *                     totalAssignments:
 *                       type: integer
 *                     pendingGrading:
 *                       type: integer
 *                     recentSubmissions:
 *                       type: array
 *                       items:
 *                         type: object
 *                     courseAnalytics:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.get('/professor/me', 
  authorize('professor'),
  dashboardCache(), // Cache dashboard data for 5 minutes
  getProfessorDashboard
);

/**
 * @swagger
 * /api/v1/dashboard/admin/me:
 *   get:
 *     summary: Get admin dashboard data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalStudents:
 *                       type: integer
 *                     totalProfessors:
 *                       type: integer
 *                     totalCourses:
 *                       type: integer
 *                     activeStudents:
 *                       type: integer
 *                     recentNotices:
 *                       type: array
 *                       items:
 *                         type: object
 *                     systemHealth:
 *                       type: object
 *                     analytics:
 *                       type: object
 */
router.get('/admin/me', 
  authorize('admin'),
  dashboardCache(), // Cache dashboard data for 5 minutes
  getAdminDashboard
);

export default router;