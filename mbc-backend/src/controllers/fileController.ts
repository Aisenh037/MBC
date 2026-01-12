/**
 * File Controller
 * Handles file uploads to Cloudinary for assignments, profiles, and documents
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { ErrorResponse } from '@/utils/errorResponse';
import { validateRequestZod } from '@/middleware/validation';
import { 
  FileUploadResponse, 
  SignedUploadUrlResponse,
  ApiResponse 
} from '@/types/api';
import { AuthenticatedUser } from '@/types/auth';
import config from '@/config/config';
import logger from '@/utils/logger';
import cloudinaryService from '@/services/cloudinaryService';

// Initialize Supabase client
const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceKey
);

// Extend Express Request to include user
interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// Validation schemas
const signedUploadUrlSchema = z.object({
  category: z.enum(['assignment', 'submission', 'profile', 'document']),
  assignmentId: z.string().uuid().optional(),
  documentCategory: z.string().optional()
});

/**
 * Upload assignment file
 * @route POST /api/v1/files/assignment/:assignmentId
 * @access Private (Admin, Professor, Student)
 */
export const uploadAssignmentFile = [
  cloudinaryService.upload.single('file'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!config.cloudinary) {
      throw new ErrorResponse('File upload service is not configured', 503);
    }

    const { assignmentId } = req.params;
    
    if (!assignmentId) {
      throw new ErrorResponse('Assignment ID is required', 400);
    }
    
    // Check if file was uploaded
    if (!req.file) {
      throw new ErrorResponse('No file uploaded', 400);
    }

    // Verify assignment exists and user has access
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select(`
        id, title, course_id, professor_id,
        course:courses(id, name),
        professor:users(id, email)
      `)
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      throw new ErrorResponse('Assignment not found', 404);
    }

    // Check permissions
    if (req.user?.role === 'student') {
      // Check if student is enrolled in the course
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', req.user.id)
        .single();

      if (!student) {
        throw new ErrorResponse('Student record not found', 404);
      }

      const { data: enrollment } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('course_id', assignment.course_id)
        .eq('student_id', student.id)
        .single();

      if (!enrollment) {
        throw new ErrorResponse('Access denied', 403);
      }
    } else if (req.user?.role === 'professor') {
      // Check if professor teaches this course
      if (assignment.professor_id !== req.user.id) {
        throw new ErrorResponse('Access denied', 403);
      }
    }

    if (!req.user?.id) {
      throw new ErrorResponse('User authentication required', 401);
    }

    // Upload file to Cloudinary
    const uploadResult = await cloudinaryService.uploadAssignmentFile(
      req.file.buffer,
      req.file.originalname,
      assignmentId,
      req.user.id
    );

    // Store file record in database
    const { data: fileRecord, error: fileError } = await supabase
      .from('file_uploads')
      .insert({
        public_id: uploadResult.public_id,
        original_filename: req.file.originalname,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        url: uploadResult.secure_url,
        category: 'assignment',
        assignment_id: assignmentId,
        uploaded_by: req.user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (fileError) {
      logger.error('Failed to store file record:', fileError);
      // Try to delete the uploaded file from Cloudinary
      try {
        await cloudinaryService.deleteFromCloudinary(uploadResult.public_id, 'raw');
      } catch (deleteError) {
        logger.error('Failed to cleanup Cloudinary file:', deleteError);
      }
      throw new ErrorResponse('Failed to store file record', 500);
    }

    logger.info(`Assignment file uploaded successfully: ${uploadResult.public_id}`);

    const response: ApiResponse<FileUploadResponse> = {
      success: true,
      data: {
        fileId: fileRecord.id,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        uploadedAt: fileRecord.created_at
      },
      message: 'File uploaded successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Upload assignment file error:', error);
    next(error);
  }
}];

/**
 * Upload profile picture
 * @route POST /api/v1/files/profile-picture
 * @access Private (All authenticated users)
 */
export const uploadProfilePicture = [
  cloudinaryService.upload.single('file'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!config.cloudinary) {
      throw new ErrorResponse('File upload service is not configured', 503);
    }

    // Check if file was uploaded
    if (!req.file) {
      throw new ErrorResponse('No file uploaded', 400);
    }

    // Validate file type (only images)
    if (!req.file.mimetype.startsWith('image/')) {
      throw new ErrorResponse('Only image files are allowed for profile pictures', 400);
    }

    if (!req.user?.id) {
      throw new ErrorResponse('User authentication required', 401);
    }

    // Upload file to Cloudinary with transformations
    const uploadResult = await cloudinaryService.uploadProfilePicture(
      req.file.buffer,
      req.user.id
    );

    // Store file record in database
    const { data: fileRecord, error: fileError } = await supabase
      .from('file_uploads')
      .insert({
        public_id: uploadResult.public_id,
        original_filename: req.file.originalname,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        url: uploadResult.secure_url,
        category: 'profile',
        uploaded_by: req.user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (fileError) {
      logger.error('Failed to store file record:', fileError);
      // Try to delete the uploaded file from Cloudinary
      try {
        await cloudinaryService.deleteFromCloudinary(uploadResult.public_id, 'image');
      } catch (deleteError) {
        logger.error('Failed to cleanup Cloudinary file:', deleteError);
      }
      throw new ErrorResponse('Failed to store file record', 500);
    }

    // Update user profile with new profile picture URL
    const updateData: any = { profile_picture_url: uploadResult.secure_url };
    
    if (req.user.role === 'student') {
      await supabase
        .from('students')
        .update(updateData)
        .eq('user_id', req.user.id);
    } else if (req.user.role === 'professor') {
      await supabase
        .from('professors')
        .update(updateData)
        .eq('user_id', req.user.id);
    } else if (req.user.role === 'admin') {
      await supabase
        .from('admins')
        .update(updateData)
        .eq('user_id', req.user.id);
    }

    logger.info(`Profile picture uploaded successfully: ${uploadResult.public_id}`);

    const response: ApiResponse<FileUploadResponse> = {
      success: true,
      data: {
        fileId: fileRecord.id,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        uploadedAt: fileRecord.created_at
      },
      message: 'Profile picture uploaded successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Upload profile picture error:', error);
    next(error);
  }
}];

/**
 * Upload document
 * @route POST /api/v1/files/document/:category
 * @access Private (Admin, Professor)
 */
export const uploadDocument = [
  cloudinaryService.upload.single('file'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!config.cloudinary) {
      throw new ErrorResponse('File upload service is not configured', 503);
    }

    const { category } = req.params;
    
    if (!category) {
      throw new ErrorResponse('Document category is required', 400);
    }
    
    // Check if file was uploaded
    if (!req.file) {
      throw new ErrorResponse('No file uploaded', 400);
    }

    // Validate category
    const validCategories = ['syllabus', 'notice', 'policy', 'form', 'other'];
    if (!validCategories.includes(category)) {
      throw new ErrorResponse('Invalid document category', 400);
    }

    if (!req.user?.id) {
      throw new ErrorResponse('User authentication required', 401);
    }

    // Upload file to Cloudinary
    const uploadResult = await cloudinaryService.uploadDocument(
      req.file.buffer,
      req.file.originalname,
      category,
      req.user.id
    );

    // Store file record in database
    const { data: fileRecord, error: fileError } = await supabase
      .from('file_uploads')
      .insert({
        public_id: uploadResult.public_id,
        original_filename: req.file.originalname,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        url: uploadResult.secure_url,
        category: 'document',
        document_category: category,
        uploaded_by: req.user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (fileError) {
      logger.error('Failed to store file record:', fileError);
      // Try to delete the uploaded file from Cloudinary
      try {
        await cloudinaryService.deleteFromCloudinary(uploadResult.public_id, 'raw');
      } catch (deleteError) {
        logger.error('Failed to cleanup Cloudinary file:', deleteError);
      }
      throw new ErrorResponse('Failed to store file record', 500);
    }

    logger.info(`Document uploaded successfully: ${uploadResult.public_id}`);

    const response: ApiResponse<FileUploadResponse> = {
      success: true,
      data: {
        fileId: fileRecord.id,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        uploadedAt: fileRecord.created_at
      },
      message: 'Document uploaded successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Upload document error:', error);
    next(error);
  }
}];

/**
 * Delete file
 * @route DELETE /api/v1/files/:publicId
 * @access Private (Admin, Owner of file)
 */
export const deleteFile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!config.cloudinary) {
      throw new ErrorResponse('File upload service is not configured', 503);
    }

    const { publicId } = req.params;

    if (!publicId) {
      throw new ErrorResponse('Public ID is required', 400);
    }

    // Get file record
    const { data: fileRecord, error: fileError } = await supabase
      .from('file_uploads')
      .select('*')
      .eq('public_id', publicId)
      .single();

    if (fileError || !fileRecord) {
      throw new ErrorResponse('File not found', 404);
    }

    // Check permissions
    if (req.user?.role !== 'admin' && fileRecord.uploaded_by !== req.user?.id) {
      throw new ErrorResponse('Access denied', 403);
    }

    // Delete from Cloudinary
    const resourceType = fileRecord.category === 'profile' ? 'image' : 'raw';
    await cloudinaryService.deleteFromCloudinary(publicId, resourceType);

    // Delete from database
    const { error: deleteError } = await supabase
      .from('file_uploads')
      .delete()
      .eq('public_id', publicId);

    if (deleteError) {
      logger.error('Failed to delete file record:', deleteError);
      throw new ErrorResponse('Failed to delete file record', 500);
    }

    logger.info(`File deleted successfully: ${publicId}`);

    const response: ApiResponse<{}> = {
      success: true,
      data: {},
      message: 'File deleted successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Delete file error:', error);
    next(error);
  }
};

/**
 * Get signed upload URL for direct client uploads
 * @route POST /api/v1/files/signed-url
 * @access Private (All authenticated users)
 */
export const getSignedUploadUrl = [
  validateRequestZod(signedUploadUrlSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!config.cloudinary) {
        throw new ErrorResponse('File upload service is not configured', 503);
      }

      const { category, assignmentId, documentCategory } = req.body;

      // Determine folder based on category
      let folder = 'mbc-uploads';
      const tags: string[] = [category];

      switch (category) {
        case 'assignment':
          if (!assignmentId) {
            throw new ErrorResponse('Assignment ID is required for assignment uploads', 400);
          }
          if (!req.user?.id) {
            throw new ErrorResponse('User authentication required', 401);
          }
          folder = `mbc-uploads/assignments/${assignmentId}`;
          tags.push(assignmentId, req.user.id);
          break;
        case 'submission':
          if (!assignmentId) {
            throw new ErrorResponse('Assignment ID is required for submission uploads', 400);
          }
          if (!req.user?.id) {
            throw new ErrorResponse('User authentication required', 401);
          }
          folder = `mbc-uploads/submissions/${assignmentId}`;
          tags.push(assignmentId, req.user.id);
          break;
        case 'profile':
          if (!req.user?.id) {
            throw new ErrorResponse('User authentication required', 401);
          }
          folder = 'mbc-uploads/profiles';
          tags.push(req.user.id);
          break;
        case 'document':
          if (!documentCategory) {
            throw new ErrorResponse('Document category is required for document uploads', 400);
          }
          if (!req.user?.id) {
            throw new ErrorResponse('User authentication required', 401);
          }
          folder = `mbc-uploads/documents/${documentCategory}`;
          tags.push(documentCategory, req.user.id);
          break;
      }

      // Generate signed upload URL
      const signedUrl = cloudinaryService.generateSignedUploadUrl(folder, tags);

      const response: ApiResponse<SignedUploadUrlResponse> = {
        success: true,
        data: {
          ...signedUrl,
          folder
        },
        message: 'Signed upload URL generated successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Get signed upload URL error:', error);
      next(error);
    }
  }
];

/**
 * Get file information
 * @route GET /api/v1/files/info/:publicId
 * @access Private (All authenticated users)
 */
export const getFileInfo = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!config.cloudinary) {
      throw new ErrorResponse('File upload service is not configured', 503);
    }

    const { publicId } = req.params;

    if (!publicId) {
      throw new ErrorResponse('Public ID is required', 400);
    }

    // Get file record from database
    const { data: fileRecord, error: fileError } = await supabase
      .from('file_uploads')
      .select('*')
      .eq('public_id', publicId)
      .single();

    if (fileError || !fileRecord) {
      throw new ErrorResponse('File not found', 404);
    }

    // Get file info from Cloudinary
    const cloudinaryInfo = await cloudinaryService.getFileInfo(publicId);

    const response: ApiResponse<any> = {
      success: true,
      data: {
        ...fileRecord,
        cloudinary: cloudinaryInfo
      }
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get file info error:', error);
    next(error);
  }
};