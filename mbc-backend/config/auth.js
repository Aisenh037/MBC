import dotenv from 'dotenv';
dotenv.config();

export const FILE_UPLOAD_PATH = process.env.FILE_UPLOAD_PATH || 'public/uploads';
export const MAX_FILE_UPLOAD = process.env.MAX_FILE_UPLOAD || 10000000; // 10MB
