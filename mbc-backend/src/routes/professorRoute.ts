import { Router } from 'express';
import { protect, authorize } from '@/middleware/auth';
import { cacheMiddleware, invalidateCache } from '@/middleware/cache';
import { validateRequestZod } from '@/middleware/validation';
import {
  getProfessors,
  createProfessor,
  updateProfessor,
  deleteProfessor,
} from '@/controllers/professorController';
import { CACHE_KEYS, CACHE_TTL } from '@/services/redisService';

const router = Router();

// All routes in this file are protected and require a user to be logged in.
router.use(protect);

/**
 * @swagger
 * /api/v1/professors:
 *   get:
 *     summary: Get all professors
 *     tags: [Professors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of professors retrieved successfully
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
 *                     $ref: '#/components/schemas/Professor'
 *   post:
 *     summary: Create a new professor
 *     tags: [Professors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProfessorRequest'
 *     responses:
 *       201:
 *         description: Professor created successfully
 */
router.route('/')
  .get(
    authorize('admin', 'professor'),
    cacheMiddleware({
      ttl: CACHE_TTL.LONG, // Cache professor list for 2 hours
      prefix: CACHE_KEYS.PROFESSOR,
      varyBy: ['query:department', 'query:isActive']
    }),
    getProfessors
  )
  .post(
    authorize('admin'),
    validateRequestZod('createProfessor'),
    invalidateCache([`professors:*`, 'dashboard:analytics:*'], CACHE_KEYS.PROFESSOR),
    createProfessor
  );

/**
 * @swagger
 * /api/v1/professors/{id}:
 *   put:
 *     summary: Update a professor
 *     tags: [Professors]
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
 *             $ref: '#/components/schemas/UpdateProfessorRequest'
 *     responses:
 *       200:
 *         description: Professor updated successfully
 *   delete:
 *     summary: Delete a professor
 *     tags: [Professors]
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
 *         description: Professor deleted successfully
 */
router.route('/:id')
  .put(
    authorize('admin'),
    validateRequestZod('updateProfessor'),
    invalidateCache([`professors:*`, 'dashboard:analytics:*'], CACHE_KEYS.PROFESSOR),
    updateProfessor
  )
  .delete(
    authorize('admin'),
    invalidateCache([`professors:*`, 'dashboard:analytics:*'], CACHE_KEYS.PROFESSOR),
    deleteProfessor
  );

export default router;