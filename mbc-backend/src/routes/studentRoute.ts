import { Router } from 'express';
import { protect, authorize } from '@/middleware/auth';
import { studentListCache, invalidateCache } from '@/middleware/cache';
import { validateRequestZod } from '@/middleware/validation';
import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkImportStudents,
  exportStudents,
  sendPasswordResetLink,
} from '@/controllers/studentController';
import { CACHE_KEYS } from '@/services/redisService';

const router = Router();

// All routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/v1/students:
 *   get:
 *     summary: Get all students with pagination and filtering
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or roll number
 *       - in: query
 *         name: branch
 *         schema:
 *           type: string
 *         description: Filter by branch ID
 *       - in: query
 *         name: semester
 *         schema:
 *           type: integer
 *         description: Filter by semester
 *     responses:
 *       200:
 *         description: List of students retrieved successfully
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
 *                     students:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Student'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *   post:
 *     summary: Create a new student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStudentRequest'
 *     responses:
 *       201:
 *         description: Student created successfully
 */
router.route('/')
  .get(
    authorize('admin', 'professor'),
    studentListCache(), // Cache student list with pagination
    getStudents
  )
  .post(
    authorize('admin'),
    validateRequestZod('createStudent'),
    invalidateCache([`students:*`, 'dashboard:analytics:*'], CACHE_KEYS.STUDENT), // Invalidate student cache
    createStudent
  );

/**
 * @swagger
 * /api/v1/students/bulk-import:
 *   post:
 *     summary: Bulk import students from CSV file
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Students imported successfully
 */
router.post('/bulk-import', 
  authorize('admin'),
  invalidateCache([`students:*`, 'dashboard:analytics:*'], CACHE_KEYS.STUDENT),
  bulkImportStudents
);

/**
 * @swagger
 * /api/v1/students/bulk-export:
 *   get:
 *     summary: Export students to CSV file
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Students exported successfully
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get('/bulk-export', 
  authorize('admin'),
  exportStudents
);

/**
 * @swagger
 * /api/v1/students/{id}:
 *   put:
 *     summary: Update a student
 *     tags: [Students]
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
 *             $ref: '#/components/schemas/UpdateStudentRequest'
 *     responses:
 *       200:
 *         description: Student updated successfully
 *   delete:
 *     summary: Delete a student
 *     tags: [Students]
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
 *         description: Student deleted successfully
 */
router.route('/:id')
  .put(
    authorize('admin'),
    validateRequestZod('updateStudent'),
    invalidateCache([`students:*`, 'dashboard:analytics:*'], CACHE_KEYS.STUDENT),
    updateStudent
  )
  .delete(
    authorize('admin'),
    invalidateCache([`students:*`, 'dashboard:analytics:*'], CACHE_KEYS.STUDENT),
    deleteStudent
  );

/**
 * @swagger
 * /api/v1/students/{id}/send-reset-link:
 *   post:
 *     summary: Send password reset link to student
 *     tags: [Students]
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
 *         description: Reset link sent successfully
 */
router.post('/:id/send-reset-link', 
  authorize('admin'),
  sendPasswordResetLink
);

export default router;