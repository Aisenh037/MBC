import { Router } from 'express';
import { protect, authorize } from '@/middleware/auth';
import { analyticsCache } from '@/middleware/cache';
import {
  getDashboardAnalytics,
  getStudentAnalytics,
  getCourseAnalytics,
  getPerformanceAnalytics,
} from '@/controllers/analyticsController';

const router = Router();

/**
 * @swagger
 * /api/v1/analytics:
 *   get:
 *     summary: Get dashboard analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [overview, detailed]
 *         description: Type of analytics
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
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
 *                     enrollmentTrends:
 *                       type: array
 *                       items:
 *                         type: object
 *                     performanceMetrics:
 *                       type: object
 */
router.get('/', 
  protect, 
  authorize('admin', 'professor'),
  analyticsCache(), // Cache analytics for 30 minutes
  getDashboardAnalytics
);

/**
 * @swagger
 * /api/v1/analytics/students:
 *   get:
 *     summary: Get student analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student analytics retrieved successfully
 */
router.get('/students', 
  protect, 
  authorize('admin', 'professor'),
  analyticsCache(),
  getStudentAnalytics
);

/**
 * @swagger
 * /api/v1/analytics/courses:
 *   get:
 *     summary: Get course analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Course analytics retrieved successfully
 */
router.get('/courses', 
  protect, 
  authorize('admin', 'professor'),
  analyticsCache(),
  getCourseAnalytics
);

/**
 * @swagger
 * /api/v1/analytics/performance:
 *   get:
 *     summary: Get performance analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance analytics retrieved successfully
 */
router.get('/performance', 
  protect, 
  authorize('admin', 'professor'),
  analyticsCache(),
  getPerformanceAnalytics
);

export default router;