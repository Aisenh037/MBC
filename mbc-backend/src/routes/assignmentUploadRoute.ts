/**
 * Assignment Upload Routes
 * Enhanced file upload routes for assignments
 */

import express from 'express';
import { protect, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import {
  uploadAssignmentFiles,
  getSubmissionFiles,
  downloadSubmissionFile,
  deleteSubmissionFile
} from '../controllers/assignmentUploadController';

const router = express.Router();

// All routes require authentication
// Apply authentication to all routes
router.use(protect);

/**
 * @swagger
 * /api/v1/assignments/upload:
 *   post:
 *     summary: Upload assignment files
 *     tags: [Assignment Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Assignment files (max 10 files, 50MB each)
 *               assignmentId:
 *                 type: string
 *                 format: uuid
 *                 description: Assignment ID
 *               content:
 *                 type: string
 *                 description: Optional text content
 *               submissionNotes:
 *                 type: string
 *                 description: Optional submission notes
 *     responses:
 *       201:
 *         description: Assignment submitted successfully
 *       200:
 *         description: Assignment submission updated successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Access denied
 *       404:
 *         description: Assignment not found
 */
router.post('/upload', authorize(UserRole.student), uploadAssignmentFiles);

/**
 * @swagger
 * /api/v1/assignments/{id}/submissions/{submissionId}/files:
 *   get:
 *     summary: Get assignment submission files
 *     tags: [Assignment Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Assignment ID
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Submission ID
 *     responses:
 *       200:
 *         description: Submission files retrieved successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Submission not found
 */
router.get('/:id/submissions/:submissionId/files', getSubmissionFiles);

/**
 * @swagger
 * /api/v1/assignments/{id}/submissions/{submissionId}/files/{fileId}/download:
 *   get:
 *     summary: Download assignment submission file
 *     tags: [Assignment Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Assignment ID
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Submission ID
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *     responses:
 *       302:
 *         description: Redirect to download URL
 *       403:
 *         description: Access denied
 *       404:
 *         description: File not found
 */
router.get('/:id/submissions/:submissionId/files/:fileId/download', downloadSubmissionFile);

/**
 * @swagger
 * /api/v1/assignments/{id}/submissions/{submissionId}/files/{fileId}:
 *   delete:
 *     summary: Delete assignment submission file
 *     tags: [Assignment Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Assignment ID
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Submission ID
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       400:
 *         description: Cannot delete files after deadline
 *       403:
 *         description: Access denied
 *       404:
 *         description: File not found
 */
router.delete('/:id/submissions/:submissionId/files/:fileId', authorize(UserRole.student), deleteSubmissionFile);

export default router;