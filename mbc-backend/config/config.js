import dotenv from 'dotenv';
// dotenv.config(); already handled in index.js

export const PORT = process.env.PORT || 5000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const MONGO_URI = process.env.MONGO_URI || '';
export const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Rate Limiting
export const RATE_LIMIT_WINDOW = process.env.RATE_LIMIT_WINDOW || 15 * 60 * 1000; // 15 minutes
export const RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX || 100;

// File Uploads
export const FILE_UPLOAD_PATH = process.env.FILE_UPLOAD_PATH || 'public/uploads';
export const MAX_FILE_UPLOAD = process.env.MAX_FILE_UPLOAD || 10 * 1024 * 1024; // 10MB