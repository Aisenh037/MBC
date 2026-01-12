import { Router } from 'express';
import {
    getAttendance,
    markAttendance,
    getAttendanceStats
} from '@/controllers/attendanceController';
import { protect, authorize } from '@/middleware/auth';

const router = Router();

// Protected routes
router.use(protect);

router.route('/')
    .get(getAttendance)
    .post(authorize('admin', 'professor'), markAttendance);

router.get('/stats', getAttendanceStats);

export default router;
