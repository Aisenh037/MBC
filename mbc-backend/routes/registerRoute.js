import express from 'express';
import { registerStudent, registerTeacher } from '../controllers/registerController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/student', protect, authorize('admin'), registerStudent);
router.post('/teacher', protect, authorize('admin'), registerTeacher);

export default router;
