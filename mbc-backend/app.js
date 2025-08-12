import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import errorHandler from './middleware/errorHandler.js';

// Import Routes
import authRoutes from './routes/authRoute.js';
import studentRoutes from './routes/studentRoute.js';
import professorRoutes from './routes/professorRoute.js';
import branchRoutes from './routes/branchRoute.js';
import courseRoutes from './routes/courseRoute.js';
import noticeRoutes from './routes/noticeRoute.js';
import analyticsRoutes from './routes/analytics.js';
import dashboardRoutes from './routes/dashboardRoute.js';

const app = express();

// --- Core Middleware ---
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: '*', credentials: true }));

// --- Security Middleware ---
app.use(helmet());
app.use(mongoSanitize());
app.use(hpp());

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// --- Static Folder for Uploads ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// --- API Routes ---
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/professors', professorRoutes);
app.use('/api/v1/branches', branchRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/notices', noticeRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// --- Central Error Handler (must be after routes) ---
app.use(errorHandler);

export default app; // <-- This is the most important part