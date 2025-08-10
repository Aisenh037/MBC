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
import usersRoutes from './routes/usersRoute.js';
import teachersRoutes from './routes/teachersRoute.js';
import studentRoutes from './routes/studentRoute.js';
import courseRoutes from './routes/courseRoute.js';
import subjectRoutes from './routes/subjectRoute.js';
import branchRoutes from './routes/branchRoute.js';
import assignmentRoutes from './routes/assignmentRoute.js';
import marksRoutes from './routes/marksRoute.js';
import attendanceRoutes from './routes/attendanceRoute.js';
import noticeRoutes from './routes/noticeRoute.js';
import analyticsRoutes from './routes/analyticsRoute.js';
import studentDashboardRoutes from './routes/studentDashboardRoute.js';
import teacherDashboardRoutes from './routes/teacherDashboardRoute.js';
// Add any other route imports here...

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Initialize the Express application
const app = express();

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
    origin: (process.env.CORS_ORIGIN || '').split(','),
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
app.use(`${API_PREFIX}/teachers`, teachersRoutes);
app.use(`${API_PREFIX}/students`, studentRoutes);
app.use(`${API_PREFIX}/courses`, courseRoutes);
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


// --- Error Handling Middleware ---
// This must be the LAST piece of middleware
app.use(errorHandler);

export default app;