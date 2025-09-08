const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');

const config = require('./config/config.js');
const errorHandler = require('./middleware/errorHandler.js');

// Import Routes
const authRoutes = require('./routes/authRoute.js');
const studentRoutes = require('./routes/studentRoute.js');
const professorRoutes = require('./routes/professorRoute.js');
const branchRoutes = require('./routes/branchRoute.js');
const courseRoutes = require('./routes/courseRoute.js');
const noticeRoutes = require('./routes/noticeRoute.js');
const analyticsRoutes = require('./routes/analytics.js');
const dashboardRoutes = require('./routes/dashboardRoute.js');

const app = express();

// --- Core Middleware ---
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: config.cors.origins, credentials: true }));

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
app.use(express.static(path.join(__dirname, 'public')));

// --- API Routes ---
app.use('/api/v1/auth', authRoutes);

app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/professors', professorRoutes);
app.use('/api/v1/branches', branchRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/notices', noticeRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// --- Central Error Handler (must be after routes) ---
app.use(errorHandler);

module.exports = app;
