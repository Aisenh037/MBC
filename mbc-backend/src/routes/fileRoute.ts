/**
 * File Upload Routes
 * Handles file uploads to Cloudinary for assignments, profiles, and documents
 */

import { Router } from 'express';
import { protect, authorize } from '@/middleware/auth';
import {
  uploadAssignmentFile,
  uploadProfilePicture,
  uploadDocument,
  deleteFile,
  getSignedUploadUrl,
  getFileInfo
} from '@/controllers/fileController';

const router = Router();

// All file routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/v1/files/assignment/{assignmentId}:
 *   post:
 *     summary: Upload assignment file
 *     description: Upload a file for a specific assignment (students submit, professors add resources)
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Assignment ID
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
 *                 description: File to upload (max 10MB)
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/FileUpload'
 *       400:
 *         description: Invalid file or assignment ID
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Assignment not found
 *       413:
 *         description: File too large
 *       503:
 *         description: File upload service unavailable
 */
router.post('/assignment/:assignmentId', 
  authorize('admin', 'professor', 'student'), 
  uploadAssignmentFile
);

/**
 * @swagger
 * /api/v1/files/profile-picture:
 *   post:
 *     summary: Upload profile picture
 *     description: Upload or update user profile picture (images only)
 *     tags: [Files]
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
 *                 description: Image file (JPEG, PNG, GIF, WebP - max 10MB)
 *     responses:
 *       201:
 *         description: Profile picture uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/FileUpload'
 *       400:
 *         description: Invalid file type (only images allowed)
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       413:
 *         description: File too large
 *       503:
 *         description: File upload service unavailable
 */
router.post('/profile-picture', uploadProfilePicture);

/**
 * @swagger
 * /api/v1/files/document/{category}:
 *   post:
 *     summary: Upload document
 *     description: Upload institutional documents (syllabus, notices, policies, etc.)
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [syllabus, notice, policy, form, other]
 *         description: Document category
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
 *                 description: Document file (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP - max 10MB)
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/FileUpload'
 *       400:
 *         description: Invalid file type or category
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       413:
 *         description: File too large
 *       503:
 *         description: File upload service unavailable
 */
router.post('/document/:category', 
  authorize('admin', 'professor'), 
  uploadDocument
);

/**
 * @swagger
 * /api/v1/files/{publicId}:
 *   delete:
 *     summary: Delete file
 *     description: Delete a file from storage (admin or file owner only)
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cloudinary public ID of the file
 *     responses:
 *       200:
 *         description: File deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       503:
 *         description: File upload service unavailable
 */
router.delete('/:publicId', deleteFile);

/**
 * @swagger
 * /api/v1/files/signed-url:
 *   post:
 *     summary: Get signed upload URL
 *     description: Generate signed URL for direct client-side uploads to Cloudinary
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *             properties:
 *               category:
 *                 type: string
 *                 enum: [assignment, submission, profile, document]
 *                 description: File category
 *               assignmentId:
 *                 type: string
 *                 format: uuid
 *                 description: Required for assignment/submission uploads
 *               documentCategory:
 *                 type: string
 *                 enum: [syllabus, notice, policy, form, other]
 *                 description: Required for document uploads
 *           example:
 *             category: "document"
 *             documentCategory: "syllabus"
 *     responses:
 *       200:
 *         description: Signed URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         url:
 *                           type: string
 *                           format: uri
 *                           description: Cloudinary upload URL
 *                         signature:
 *                           type: string
 *                           description: Upload signature
 *                         timestamp:
 *                           type: number
 *                           description: Signature timestamp
 *                         api_key:
 *                           type: string
 *                           description: Cloudinary API key
 *                         folder:
 *                           type: string
 *                           description: Upload folder path
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       503:
 *         description: File upload service unavailable
 */
router.post('/signed-url', getSignedUploadUrl);

/**
 * @swagger
 * /api/v1/files/info/{publicId}:
 *   get:
 *     summary: Get file information
 *     description: Retrieve detailed information about a file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cloudinary public ID of the file
 *     responses:
 *       200:
 *         description: File information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         public_id:
 *                           type: string
 *                         original_filename:
 *                           type: string
 *                         file_size:
 *                           type: number
 *                         mime_type:
 *                           type: string
 *                         url:
 *                           type: string
 *                           format: uri
 *                         category:
 *                           type: string
 *                         uploaded_by:
 *                           type: string
 *                           format: uuid
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                         cloudinary:
 *                           type: object
 *                           description: Additional Cloudinary metadata
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       503:
 *         description: File upload service unavailable
 */
router.get('/info/:publicId', getFileInfo);

export default router;