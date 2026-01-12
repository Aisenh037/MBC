/**
 * Assignment Upload Controller
 * Enhanced file upload handling for assignments with notifications
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { createClient } from '@supabase/supabase-js';
import { ErrorResponse } from '@/utils/errorResponse';
import { validateRequestZod } from '@/middleware/validation';
import cloudinaryService from '../services/cloudinaryService';
import { notificationService } from '../services/notificationService';
import { websocketService } from '../services/websocketService';
import { AuthenticatedUser } from '@/types/auth';
import { ApiResponse } from '@/types/api';
import { config } from '@/config/config';
import logger from '@/utils/logger';

// Initialize Supabase client
const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceKey
);

// Extend Express Request to include user
interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'assignments');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow common document and image formats
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/zip',
    'application/x-zip-compressed'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only documents, images, and zip files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Maximum 10 files per upload
  }
});

// Validation schemas
const assignmentSubmissionSchema = z.object({
  assignmentId: z.string().uuid('Valid assignment ID is required'),
  content: z.string().optional(),
  submissionNotes: z.string().optional()
});

/**
 * Upload assignment files
 * @route POST /api/v1/assignments/upload
 * @access Private (Student)
 */
export const uploadAssignmentFiles = [
  upload.array('files', 10),
  validateRequestZod(assignmentSubmissionSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { assignmentId, content, submissionNotes } = req.body;
      const files = req.files as Express.Multer.File[];

      // Only students can upload assignment files
      if (req.user?.role !== 'student') {
        throw new ErrorResponse('Only students can upload assignment files', 403);
      }

      if (!files || files.length === 0) {
        throw new ErrorResponse('No files uploaded', 400);
      }

      // Get student record
      const { data: student, error: studentError } = await supabase
        .from('users')
        .select(`
          id, email, profile,
          student_profile:student_profiles(id, roll_number)
        `)
        .eq('id', req.user.id)
        .eq('role', 'student')
        .single();

      if (studentError || !student) {
        throw new ErrorResponse('Student record not found', 404);
      }

      // Get assignment details
      const { data: assignment, error: assignmentError } = await supabase
        .from('assignments')
        .select(`
          *,
          course:courses(
            id, name, code,
            professor:users!courses_professor_id_fkey(id, email, profile)
          )
        `)
        .eq('id', assignmentId)
        .single();

      if (assignmentError || !assignment) {
        throw new ErrorResponse('Assignment not found', 404);
      }

      // Check if student is enrolled in the course
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('course_id', assignment.course_id)
        .eq('student_id', student.id)
        .single();

      if (!enrollment) {
        throw new ErrorResponse('You are not enrolled in this course', 403);
      }

      // Check if assignment is still open
      if (assignment.due_date && new Date(assignment.due_date) < new Date()) {
        throw new ErrorResponse('Assignment submission deadline has passed', 400);
      }

      // Upload files to Cloudinary
      const uploadedFiles = [];
      const uploadPromises = files.map(async (file) => {
        try {
          const result = await cloudinaryService.uploadFile(file.path, {
            folder: `assignments/${assignmentId}`,
            resource_type: 'auto',
            public_id: `${student.id}_${Date.now()}_${path.basename(file.originalname, path.extname(file.originalname))}`
          });

          // Clean up local file
          await fs.unlink(file.path);

          return {
            originalName: file.originalname,
            filename: result.public_id,
            url: result.secure_url,
            size: file.size,
            mimetype: file.mimetype,
            uploadedAt: new Date().toISOString()
          };
        } catch (error) {
          logger.error(`Failed to upload file ${file.originalname}:`, error);
          // Clean up local file even if upload failed
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            logger.error(`Failed to clean up file ${file.path}:`, unlinkError);
          }
          throw error;
        }
      });

      try {
        const results = await Promise.all(uploadPromises);
        uploadedFiles.push(...results);
      } catch (error) {
        throw new ErrorResponse('Failed to upload one or more files', 500);
      }

      // Check if student has already submitted
      const { data: existingSubmission } = await supabase
        .from('submissions')
        .select('id, file_attachments')
        .eq('assignment_id', assignmentId)
        .eq('student_id', student.id)
        .single();

      let submission;
      if (existingSubmission) {
        // Update existing submission
        const updatedAttachments = [
          ...(existingSubmission.file_attachments || []),
          ...uploadedFiles
        ];

        const { data: updatedSubmission, error: updateError } = await supabase
          .from('submissions')
          .update({
            content: content || null,
            file_attachments: updatedAttachments,
            submission_notes: submissionNotes || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSubmission.id)
          .select(`
            *,
            assignment:assignments(id, title, course_id),
            student:users(id, email, profile)
          `)
          .single();

        if (updateError) {
          logger.error('Failed to update submission:', updateError);
          throw new ErrorResponse('Failed to update submission', 500);
        }

        submission = updatedSubmission;
        logger.info(`Assignment submission updated: ${existingSubmission.id} by student ${student.id}`);
      } else {
        // Create new submission
        const { data: newSubmission, error: submissionError } = await supabase
          .from('submissions')
          .insert({
            assignment_id: assignmentId,
            student_id: student.id,
            content: content || null,
            file_attachments: uploadedFiles,
            submission_notes: submissionNotes || null,
            submitted_at: new Date().toISOString()
          })
          .select(`
            *,
            assignment:assignments(id, title, course_id),
            student:users(id, email, profile)
          `)
          .single();

        if (submissionError) {
          logger.error('Failed to create submission:', submissionError);
          throw new ErrorResponse('Failed to create submission', 500);
        }

        submission = newSubmission;
        logger.info(`New assignment submission created: ${newSubmission.id} by student ${student.id}`);
      }

      // Send notifications
      try {
        // Email notification to professor
        const professorEmail = assignment.course.professor.email;
        const professorName = assignment.course.professor.profile?.firstName || 'Professor';
        const studentName = `${student.profile?.firstName || ''} ${student.profile?.lastName || ''}`.trim() || student.email;

        await notificationService.sendEmail({
          to: professorEmail,
          subject: `New Assignment Submission: ${assignment.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1976d2;">New Assignment Submission</h2>
              <p>Dear ${professorName},</p>
              <p>A student has submitted an assignment for your course <strong>${assignment.course.name}</strong>.</p>
              <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
                <p><strong>Submission Details:</strong></p>
                <ul>
                  <li><strong>Assignment:</strong> ${assignment.title}</li>
                  <li><strong>Student:</strong> ${studentName}</li>
                  <li><strong>Roll Number:</strong> ${(student.student_profile as any)?.roll_number || 'N/A'}</li>
                  <li><strong>Files Uploaded:</strong> ${uploadedFiles.length}</li>
                  <li><strong>Submitted At:</strong> ${new Date().toLocaleString()}</li>
                </ul>
              </div>
              ${content ? `<p><strong>Submission Content:</strong></p><p>${content}</p>` : ''}
              ${submissionNotes ? `<p><strong>Notes:</strong></p><p>${submissionNotes}</p>` : ''}
              <p>Please log in to the system to review the submission and provide feedback.</p>
              <p>Best regards,<br>MBC Department Team</p>
            </div>
          `
        });

        // Real-time notification to professor
        await websocketService.sendNotification(assignment.course.professor.id, {
          id: `assignment_submission_${submission.id}`,
          type: 'assignment',
          title: 'New Assignment Submission',
          message: `${studentName} has submitted ${assignment.title}`,
          userId: assignment.course.professor.id,
          metadata: {
            assignmentId,
            submissionId: submission.id,
            studentId: student.id,
            courseId: assignment.course_id
          },
          createdAt: new Date()
        });

        logger.info(`Notifications sent for assignment submission: ${submission.id}`);
      } catch (notificationError) {
        logger.error('Failed to send notifications:', notificationError);
        // Don't fail the request if notifications fail
      }

      const response: ApiResponse<any> = {
        success: true,
        data: {
          submission,
          uploadedFiles,
          message: existingSubmission ? 'Assignment submission updated successfully' : 'Assignment submitted successfully'
        }
      };

      res.status(existingSubmission ? 200 : 201).json(response);
    } catch (error) {
      logger.error('Upload assignment files error:', error);
      
      // Clean up uploaded files if there was an error
      if (req.files) {
        const files = req.files as Express.Multer.File[];
        for (const file of files) {
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            logger.error(`Failed to clean up file ${file.path}:`, unlinkError);
          }
        }
      }
      
      next(error);
    }
  }
];

/**
 * Get assignment submission files
 * @route GET /api/v1/assignments/:id/submissions/:submissionId/files
 * @access Private (Student - own submissions, Professor - course assignments, Admin)
 */
export const getSubmissionFiles = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: assignmentId, submissionId } = req.params;

    // Get submission with assignment details
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select(`
        *,
        assignment:assignments(
          id, title, course_id,
          course:courses(
            id, name,
            professor:users!courses_professor_id_fkey(id)
          )
        ),
        student:users(id, email, profile)
      `)
      .eq('id', submissionId)
      .eq('assignment_id', assignmentId)
      .single();

    if (submissionError || !submission) {
      throw new ErrorResponse('Submission not found', 404);
    }

    // Check access permissions
    const canAccess = 
      req.user?.role === 'admin' ||
      (req.user?.role === 'student' && submission.student.id === req.user.id) ||
      (req.user?.role === 'professor' && submission.assignment.course.professor.id === req.user.id);

    if (!canAccess) {
      throw new ErrorResponse('Access denied', 403);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: {
        submissionId: submission.id,
        assignmentId: submission.assignment_id,
        files: submission.file_attachments || [],
        submittedAt: submission.submitted_at,
        content: submission.content,
        submissionNotes: submission.submission_notes
      }
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get submission files error:', error);
    next(error);
  }
};

/**
 * Download assignment submission file
 * @route GET /api/v1/assignments/:id/submissions/:submissionId/files/:fileId/download
 * @access Private (Student - own submissions, Professor - course assignments, Admin)
 */
export const downloadSubmissionFile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: assignmentId, submissionId, fileId } = req.params;

    // Get submission with assignment details
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select(`
        *,
        assignment:assignments(
          id, title, course_id,
          course:courses(
            id, name,
            professor:users!courses_professor_id_fkey(id)
          )
        ),
        student:users(id, email, profile)
      `)
      .eq('id', submissionId)
      .eq('assignment_id', assignmentId)
      .single();

    if (submissionError || !submission) {
      throw new ErrorResponse('Submission not found', 404);
    }

    // Check access permissions
    const canAccess = 
      req.user?.role === 'admin' ||
      (req.user?.role === 'student' && submission.student.id === req.user.id) ||
      (req.user?.role === 'professor' && submission.assignment.course.professor.id === req.user.id);

    if (!canAccess) {
      throw new ErrorResponse('Access denied', 403);
    }

    // Find the file in attachments
    const fileAttachments = submission.file_attachments || [];
    const file = fileAttachments.find((f: any) => f.filename === fileId);

    if (!file) {
      throw new ErrorResponse('File not found', 404);
    }

    // Generate download URL from Cloudinary
    const downloadUrl = cloudinaryService.getDownloadUrl(file.filename);

    // Log download activity
    logger.info(`File download: ${file.originalName} from submission ${submissionId} by user ${req.user?.id}`);

    // Redirect to the download URL
    res.redirect(downloadUrl);
  } catch (error) {
    logger.error('Download submission file error:', error);
    next(error);
  }
};

/**
 * Delete assignment submission file
 * @route DELETE /api/v1/assignments/:id/submissions/:submissionId/files/:fileId
 * @access Private (Student - own submissions before deadline)
 */
export const deleteSubmissionFile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: assignmentId, submissionId, fileId } = req.params;

    // Only students can delete their own files
    if (req.user?.role !== 'student') {
      throw new ErrorResponse('Only students can delete submission files', 403);
    }

    // Get submission with assignment details
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select(`
        *,
        assignment:assignments(id, due_date),
        student:users(id)
      `)
      .eq('id', submissionId)
      .eq('assignment_id', assignmentId)
      .single();

    if (submissionError || !submission) {
      throw new ErrorResponse('Submission not found', 404);
    }

    // Check if it's the student's own submission
    if (submission.student.id !== req.user.id) {
      throw new ErrorResponse('Access denied', 403);
    }

    // Check if assignment is still open
    if (submission.assignment.due_date && new Date(submission.assignment.due_date) < new Date()) {
      throw new ErrorResponse('Cannot delete files after submission deadline', 400);
    }

    // Find and remove the file from attachments
    const fileAttachments = submission.file_attachments || [];
    const fileIndex = fileAttachments.findIndex((f: any) => f.filename === fileId);

    if (fileIndex === -1) {
      throw new ErrorResponse('File not found', 404);
    }

    const fileToDelete = fileAttachments[fileIndex];
    const updatedAttachments = fileAttachments.filter((f: any) => f.filename !== fileId);

    // Update submission
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        file_attachments: updatedAttachments,
        updated_at: new Date().toISOString()
      })
      .eq('id', submissionId);

    if (updateError) {
      logger.error('Failed to update submission:', updateError);
      throw new ErrorResponse('Failed to delete file', 500);
    }

    // Delete file from Cloudinary
    try {
      await cloudinaryService.deleteFile(fileToDelete.filename);
      logger.info(`File deleted from Cloudinary: ${fileToDelete.filename}`);
    } catch (cloudinaryError) {
      logger.error('Failed to delete file from Cloudinary:', cloudinaryError);
      // Don't fail the request if Cloudinary deletion fails
    }

    logger.info(`Submission file deleted: ${fileToDelete.originalName} from submission ${submissionId}`);

    const response: ApiResponse<{}> = {
      success: true,
      data: {},
      message: 'File deleted successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Delete submission file error:', error);
    next(error);
  }
};

export { upload };