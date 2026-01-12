import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import path from 'path';

import config from '@/config/config';
import errorHandler, { notFoundHandler } from '@/middleware/errorHandler';
import { setupSwagger } from '@/middleware/swagger';
import { apiVersioning, versionedResponse } from '@/middleware/versioning';
import { responseFormatter } from '@/utils/responseFormatter';
import { websocketStats, realTimeNotification } from '@/middleware/websocket';
import { requestTiming, memoryMonitoring, errorTracking } from '@/middleware/monitoring';

// Import Routes
import authRoutes from '@/routes/authRoute';
import studentRoutes from '@/routes/studentRoute';
import professorRoutes from '@/routes/professorRoute';
import branchRoutes from '@/routes/branchRoute';
import courseRoutes from '@/routes/courseRoute';
import attendenceRoutes from '@/routes/attendenceRoute';
import noticeRoutes from '@/routes/noticeRoute';
import assignmentRoutes from '@/routes/assignmentRoute';
import marksRoutes from '@/routes/marksRoute';
import analyticsRoutes from '@/routes/analytics';
import dashboardRoutes from '@/routes/dashboardRoute';
import profileRoutes from '@/routes/profileRoute';
import institutionRoutes from '@/routes/institution';
import fileRoutes from '@/routes/fileRoute';
import websocketRoutes from '@/routes/websocketRoute';
import aiRoutes from '@/routes/aiRoute';
import healthRoutes from '@/routes/healthRoute';
import monitoringRoutes from '@/routes/monitoringRoute';

const app: Application = express();

// --- Core Middleware ---
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: config.cors.origins,
  credentials: true
}));

// --- Security Middleware ---
app.use(helmet());
app.use(mongoSanitize());
app.use(hpp());

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// --- Static Folder for Uploads ---
app.use(express.static(path.join(__dirname, '../public')));

// --- API Documentation ---
setupSwagger(app);

// --- API Versioning ---
app.use('/api', apiVersioning);
app.use('/api', versionedResponse);

// --- Response Formatting ---
app.use(responseFormatter);

// --- Performance Monitoring ---
app.use(requestTiming);
app.use(memoryMonitoring);

// --- WebSocket Middleware ---
app.use(websocketStats());
app.use(realTimeNotification());

// --- Health Check Endpoints ---
app.use('/api/v1/health', healthRoutes);

// --- API Routes ---
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/professors', professorRoutes);
app.use('/api/v1/branches', branchRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/attendance', attendenceRoutes);
app.use('/api/v1/notices', noticeRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/marks', marksRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/institutions', institutionRoutes);
app.use('/api/v1/files', fileRoutes);
app.use('/api/v1/websocket', websocketRoutes);
app.use('/api/v1/ai', aiRoutes);

// --- Public Metrics Endpoint ---
app.use('/metrics', monitoringRoutes);

// --- 404 Handler for undefined routes ---
app.use(notFoundHandler);

// --- Error Tracking ---
app.use(errorTracking);

// --- Central Error Handler (must be after routes) ---
app.use(errorHandler);

export default app;