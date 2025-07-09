import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import morgan from 'morgan';
import fileupload from 'express-fileupload';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import xss from 'xss-clean';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import cors from 'cors';

import errorHandler from './middleware/errorHandler.js';
import connectDB from './config/database.js';
import {
  RATE_LIMIT_WINDOW,
  RATE_LIMIT_MAX,
  MAX_FILE_UPLOAD,
  NODE_ENV,
} from './config/config.js';

// Routes
import registerRoutes from './routes/registerRoute.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import facilitiesRoutes from './routes/facilities.js';
import branchesRoutes from './routes/branches.js';
import coursesRoutes from './routes/courses.js';
import notificationsRoutes from './routes/notifications.js';
import studyMaterialRoutes from './routes/studyMaterial.js';
import assignmentRoutes from './routes/assignment.js';
import researchPaperRoutes from './routes/researchPaper.js';
import professorRoutes from './routes/professor.js';
import subjectsRoutes from './routes/subjects.js'; // Added
import studentsRoutes from './routes/studentRoute.js'; // Added

// Setup __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const initializeApp = async () => {
  await connectDB();

  const app = express();

  // Dev logging
  if (NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }

  // Security middlewares
  app.use(helmet());
  app.use(xss());
  app.use(hpp());
  app.use(mongoSanitize());

  // Rate limiter
  app.use(
    rateLimit({
      windowMs: parseInt(RATE_LIMIT_WINDOW),
      max: parseInt(RATE_LIMIT_MAX),
      message: 'Too many requests, please try again later.',
    })
  );

  // Body parser
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // File uploads
  app.use(
    fileupload({
      limits: { fileSize: parseInt(MAX_FILE_UPLOAD) },
      abortOnLimit: true,
      createParentPath: true,
    })
  );

  // Static folder
  app.use(express.static(path.join(__dirname, 'public')));

  // CORS configuration
  const allowedOrigins = [
    'http://localhost:5174',
    'http://127.0.0.1:5174',
  ];

  app.use(
    cors({
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    })
  );

  // Mount routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/register', registerRoutes);
  app.use('/api/v1/users', usersRoutes);
  app.use('/api/v1/facilities', facilitiesRoutes);
  app.use('/api/v1/branches', branchesRoutes);
  app.use('/api/v1/students/import', branchesRoutes);
  app.use('/api/v1/students', studentsRoutes);
  app.use('/api/v1/courses', coursesRoutes);
  app.use('/api/v1/notifications', notificationsRoutes);
  app.use('/api/v1/studymaterials', studyMaterialRoutes);
  app.use('/api/v1/assignments', assignmentRoutes);
  app.use('/api/v1/researchpapers', researchPaperRoutes);
  app.use('/api/v1/professors', professorRoutes);
  app.use('/api/v1/subjects', subjectsRoutes); // Added

  // Health check route
  app.get('/api/config', (req, res) => {
    res.json({ backendStatus: 'Running', nodeEnv: NODE_ENV });
  });

  // Global error handler
  app.use(errorHandler);

  return app;
};

export default initializeApp;