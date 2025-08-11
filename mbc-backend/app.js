// backend/app.js

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import xss from 'xss-clean';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

// Utilities & Middleware
import logger from './utils/logger.js';
import errorHandler from './middleware/errorHandler.js';

// CORRECTED ROUTE IMPORTS
import authRoutes from './routes/authRoute.js';
import usersRoutes from './routes/usersRouter.js';
import teachersRoutes from './routes/teacherDashboard.js';
import studentRoutes from './routes/studentRoute.js';
import subjectRoutes from './routes/subjectRoute.js';
import branchRoutes from './routes/branchRoute.js';
import assignmentRoutes from './routes/assignmentRoute.js';
import marksRoutes from './routes/marksRoute.js';
import attendanceRoutes from './routes/attendenceRoute.js';
import noticeRoutes from './routes/noticeRoute.js';
import analyticsRoutes from './routes/analytics.js';
import studentDashboardRoutes from './routes/studentDashboard.js';
import teacherDashboardRoutes from './routes/teacherDashboard.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);

// --- GLOBAL MIDDLEWARE ---
app.use(express.json());
app.use(cookieParser());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev', { stream: logger.stream }));
}

// --- SECURITY MIDDLEWARE ---
app.use(helmet());
app.use(xss());
app.use(mongoSanitize());
app.use(hpp());

const corsOptions = {
  origin: (process.env.CORS_ORIGIN || '').split(','),
  credentials: true,
};
app.use(cors(corsOptions));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP. Please try again later.',
});
app.use('/api', limiter);

// --- STATIC FILES ---
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// --- API ROUTES ---
const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, usersRoutes);  
app.use(`${API_PREFIX}/teachers`, teachersRoutes);
app.use(`${API_PREFIX}/students`, studentRoutes);
app.use(`${API_PREFIX}/subjects`, subjectRoutes);
app.use(`${API_PREFIX}/branches`, branchRoutes);
app.use(`${API_PREFIX}/assignments`, assignmentRoutes);
app.use(`${API_PREFIX}/marks`, marksRoutes);
app.use(`${API_PREFIX}/attendance`, attendanceRoutes);
app.use(`${API_PREFIX}/notices`, noticeRoutes);
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);
app.use(`${API_PREFIX}/dashboards/student`, studentDashboardRoutes);
app.use(`${API_PREFIX}/dashboards/teacher`, teacherDashboardRoutes);

// --- HEALTH CHECK & 404 HANDLER ---
app.get('/', (req, res) => res.status(200).json({ success: true, message: 'Server is running smoothly 🚀' }));
app.use((req, res) => res.status(404).json({ success: false, error: 'API endpoint not found' }));

// --- GLOBAL ERROR HANDLER (must be last) ---
app.use(errorHandler);

export default app;