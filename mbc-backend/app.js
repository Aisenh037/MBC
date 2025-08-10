// app.js
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

// Import Utilities
import logger from './utils/logger.js';
import errorHandler from './middleware/errorHandler.js';

// Import All Routes
import authRoutes from './routes/authRoute.js';
import usersRoutes from './routes/usersRouter.js';
import professorsRoutes from './routes/professorRoute.js';
import studentRoutes from './routes/studentRoute.js';
import subjectRoutes from './routes/subjectRoute.js';
import branchRoutes from './routes/brancheRoute.js';
import assignmentRoutes from './routes/assignmentRoute.js';
import marksRoutes from './routes/marksRoute.js';
import attendanceRoutes from './routes/attendenceRoute.js';
import noticeRoutes from './routes/noticeRoute.js';
import analyticsRoutes from './routes/analytics.js';
import studentDashboardRoutes from './routes/studentDashboard.js';
import teacherDashboardRoutes from './routes/teacherDashboard.js';
// Add any other route imports here...

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Initialize the Express application
const app = express();

// Honor proxy headers (Render/Heroku/etc.)
app.set('trust proxy', 1);

// --- Core Middleware ---


// Body parser for JSON
app.use(express.json());
// Cookie parser
app.use(cookieParser());
// Logger (using morgan stream piped to winston)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev', { stream: logger.stream }));
}

// --- Security Middleware ---

// Set security HTTP headers
app.use(helmet());
// Prevent XSS attacks
app.use(xss());
// Sanitize user input from MongoDB query injection
app.use(mongoSanitize());
// Prevent HTTP Parameter Pollution
app.use(hpp());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN && process.env.CORS_ORIGIN.trim().length > 0
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : true,
  credentials: true, // Allow cookies to be sent
};
app.use(cors(corsOptions));


// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/api', limiter);

// --- Static Files ---


// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));


// --- API Routes ---

const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, usersRoutes);
app.use(`${API_PREFIX}/professors`, professorsRoutes);
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

// Simple health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is healthy' });
});

// 404 for unknown API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'Not Found' });
  }
  return next();
});

// --- Error Handling Middleware ---
// This must be the LAST piece of middleware
app.use(errorHandler);

export default app;