import { Router } from 'express';
import { getMe, changePassword } from '@/controllers/authController';
import { protect } from '@/middleware/auth';

const router = Router();

// Protected routes
router.use(protect);

// GET /api/v1/profile
router.get('/', getMe);

// PUT /api/v1/profile/password
router.put('/password', changePassword);

export default router;