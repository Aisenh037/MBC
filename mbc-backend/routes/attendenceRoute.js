// routes/attendanceRoute.js
import express from 'express';
import { getAttendance, markAttendance } from '../controllers/attendenceController.js';
import protect from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';

const router = express.Router();

router.use(protect);

router.get('/', requireRole('admin', 'teacher', 'student'), getAttendance);
router.post('/', requireRole('teacher'), markAttendance);

export default router;