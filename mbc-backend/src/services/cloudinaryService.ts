/**
 * Cloudinary Service
 * Handles file uploads to Cloudinary for assignments, profile pictures, and documents
 */

import { v2 as cloudinary } from 'cloudinary';
import { Request } from 'express';
import multer from 'multer';
import { Readable } from 'stream';
import config from '@/config/config';
import logger from '@/utils/logger';

// Configure Cloudinary
if (config.cloudinary) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
} else {
  logger.warn('Cloudinary configuration not found. File upload features will be disabled.');
}

// Multer configuration for memory storage
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Allow common file types
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'application/zip',
      'application/x-zip-compressed',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`));
    }
  },
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  original_filename: string;
  format: string;
  resource_type: string;
  bytes: number;
  created_at: string;
}

export interface FileUploadOptions {
  folder?: string;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  public_id?: string;
  transformation?: any[];
  tags?: string[];
}

/**
 * Upload file buffer to Cloudinary
 */
export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  options: FileUploadOptions = {}
): Promise<CloudinaryUploadResult> => {
  try {
    if (!config.cloudinary) {
      throw new Error('Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
    }

    return new Promise((resolve, reject) => {
      const uploadOptions = {
        resource_type: options.resource_type || 'auto',
        folder: options.folder || 'mbc-uploads',
        ...(options.public_id && { public_id: options.public_id }),
        ...(options.transformation && { transformation: options.transformation }),
        ...(options.tags && { tags: options.tags }),
        use_filename: true,
        unique_filename: true,
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            logger.error('Cloudinary upload error:', error);
            reject(error);
          } else if (result) {
            logger.info(`File uploaded to Cloudinary: ${result.public_id}`);
            resolve(result as CloudinaryUploadResult);
          } else {
            reject(new Error('Upload failed - no result returned'));
          }
        }
      );

      // Convert buffer to stream and pipe to Cloudinary
      const bufferStream = new Readable();
      bufferStream.push(fileBuffer);
      bufferStream.push(null);
      bufferStream.pipe(uploadStream);
    });
  } catch (error) {
    logger.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

/**
 * Upload assignment file
 */
export const uploadAssignmentFile = async (
  fileBuffer: Buffer,
  filename: string,
  assignmentId: string,
  userId: string
): Promise<CloudinaryUploadResult> => {
  const options: FileUploadOptions = {
    folder: `mbc-uploads/assignments/${assignmentId}`,
    public_id: `${userId}_${Date.now()}_${filename.split('.')[0]}`,
    tags: ['assignment', 'submission', assignmentId, userId],
  };

  return uploadToCloudinary(fileBuffer, options);
};

/**
 * Upload profile picture
 */
export const uploadProfilePicture = async (
  fileBuffer: Buffer,
  userId: string
): Promise<CloudinaryUploadResult> => {
  const options: FileUploadOptions = {
    folder: 'mbc-uploads/profiles',
    public_id: `profile_${userId}`,
    resource_type: 'image',
    transformation: [
      { width: 300, height: 300, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' }
    ],
    tags: ['profile', 'avatar', userId],
  };

  return uploadToCloudinary(fileBuffer, options);
};

/**
 * Upload document (syllabus, notices, etc.)
 */
export const uploadDocument = async (
  fileBuffer: Buffer,
  filename: string,
  category: string,
  userId: string
): Promise<CloudinaryUploadResult> => {
  const options: FileUploadOptions = {
    folder: `mbc-uploads/documents/${category}`,
    public_id: `${category}_${userId}_${Date.now()}_${filename.split('.')[0]}`,
    tags: ['document', category, userId],
  };

  return uploadToCloudinary(fileBuffer, options);
};

/**
 * Delete file from Cloudinary
 */
export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<void> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    if (result.result === 'ok') {
      logger.info(`File deleted from Cloudinary: ${publicId}`);
    } else {
      logger.warn(`Failed to delete file from Cloudinary: ${publicId}`, result);
    }
  } catch (error) {
    logger.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

/**
 * Get optimized image URL with transformations
 */
export const getOptimizedImageUrl = (
  publicId: string,
  transformations: any[] = []
): string => {
  const defaultTransformations = [
    { quality: 'auto', fetch_format: 'auto' }
  ];

  return cloudinary.url(publicId, {
    transformation: [...defaultTransformations, ...transformations],
    secure: true,
  });
};

/**
 * Generate signed upload URL for direct client uploads
 */
export const generateSignedUploadUrl = (
  folder: string,
  tags: string[] = []
): { url: string; signature: string; timestamp: number; api_key: string } => {
  if (!config.cloudinary) {
    throw new Error('Cloudinary is not configured');
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  
  const params = {
    timestamp,
    folder,
    tags: tags.join(','),
    upload_preset: 'mbc_uploads', // You'll need to create this preset in Cloudinary
  };

  const signature = cloudinary.utils.api_sign_request(params, config.cloudinary.apiSecret);

  return {
    url: `https://api.cloudinary.com/v1_1/${config.cloudinary.cloudName}/upload`,
    signature,
    timestamp,
    api_key: config.cloudinary.apiKey,
  };
};

/**
 * Get file info from Cloudinary
 */
export const getFileInfo = async (publicId: string): Promise<any> => {
  try {
    const result = await cloudinary.api.resource(publicId);
    return result;
  } catch (error) {
    logger.error('Error getting file info from Cloudinary:', error);
    throw error;
  }
};

/**
 * List files in a folder
 */
export const listFiles = async (
  folder: string,
  maxResults: number = 50
): Promise<any[]> => {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: folder,
      max_results: maxResults,
    });

    return result.resources;
  } catch (error) {
    logger.error('Error listing files from Cloudinary:', error);
    throw error;
  }
};

/**
 * Upload file from file path (for backward compatibility)
 */
export const uploadFile = async (
  filePath: string,
  options: FileUploadOptions = {}
): Promise<CloudinaryUploadResult> => {
  try {
    if (!config.cloudinary) {
      throw new Error('Cloudinary is not configured');
    }

    return new Promise((resolve, reject) => {
      const uploadOptions = {
        resource_type: options.resource_type || 'auto',
        folder: options.folder || 'mbc-uploads',
        ...(options.public_id && { public_id: options.public_id }),
        ...(options.transformation && { transformation: options.transformation }),
        ...(options.tags && { tags: options.tags }),
        use_filename: true,
        unique_filename: true,
      };

      cloudinary.uploader.upload(filePath, uploadOptions, (error, result) => {
        if (error) {
          logger.error('Cloudinary upload error:', error);
          reject(error);
        } else if (result) {
          logger.info(`File uploaded to Cloudinary: ${result.public_id}`);
          resolve(result as CloudinaryUploadResult);
        } else {
          reject(new Error('Upload failed - no result returned'));
        }
      });
    });
  } catch (error) {
    logger.error('Error uploading file to Cloudinary:', error);
    throw error;
  }
};

/**
 * Get download URL for a file
 */
export const getDownloadUrl = (publicId: string): string => {
  if (!config.cloudinary) {
    throw new Error('Cloudinary is not configured');
  }
  
  return cloudinary.url(publicId, {
    resource_type: 'auto',
    secure: true,
    flags: 'attachment'
  });
};

/**
 * Delete file by public ID (alias for deleteFromCloudinary)
 */
export const deleteFile = async (publicId: string): Promise<void> => {
  return deleteFromCloudinary(publicId, 'raw');
};

export default {
  upload,
  uploadToCloudinary,
  uploadFile,
  uploadAssignmentFile,
  uploadProfilePicture,
  uploadDocument,
  deleteFromCloudinary,
  deleteFile,
  getOptimizedImageUrl,
  getDownloadUrl,
  generateSignedUploadUrl,
  getFileInfo,
  listFiles,
};