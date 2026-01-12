import { Router } from 'express';
import { protect, authorize } from '@/middleware/auth';
import { courseCache, invalidateCache } from '@/middleware/cache';
import { validateRequestZod } from '@/middleware/validation';
import {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
} from '@/controllers/courseController';
import { CACHE_KEYS } from '@/services/redisService';

const router = Router();

// All routes are protected and require a logged-in user
router.use(protect);

/**
 * @swagger
 * /api/v1/courses:
 *   get:
 *     summary: Get all courses with filtering
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: semester
 *         schema:
 *           type: integer
 *         description: Filter by semester
 *       - in: query
 *         name: branch
 *         schema:
 *           type: string
 *         description: Filter by branch ID
 *       - in: query
 *         name: professor
 *         schema:
 *           type: string
 *         description: Filter by professor ID
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *         description: Filter by academic year
 *     responses:
 *       200:
 *         description: List of courses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Course'
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCourseRequest'
 *     responses:
 *       201:
 *         description: Course created successfully
 */
router.route('/')
  .get(
    courseCache(), // Cache course list for 2 hours
    getCourses
  )
  .post(
    authorize('admin', 'professor'),
    validateRequestZod('createCourse'),
    invalidateCache([`courses:*`, 'dashboard:analytics:*'], CACHE_KEYS.COURSE),
    createCourse
  );

/**
 * @swagger
 * /api/v1/courses/{id}:
 *   get:
 *     summary: Get a specific course by ID
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *   put:
 *     summary: Update a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCourseRequest'
 *     responses:
 *       200:
 *         description: Course updated successfully
 *   delete:
 *     summary: Delete a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course deleted successfully
 */
router.route('/:id')
  .get(getCourse)
  .put(
    authorize('admin', 'professor'),
    validateRequestZod('updateCourse'),
    invalidateCache([`courses:*`, 'dashboard:analytics:*'], CACHE_KEYS.COURSE),
    updateCourse
  )
  .delete(
    authorize('admin', 'professor'),
    invalidateCache([`courses:*`, 'dashboard:analytics:*'], CACHE_KEYS.COURSE),
    deleteCourse
  );

export default router;