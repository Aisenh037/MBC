import { Router } from 'express';
import {
    getInstitutions,
    getInstitution,
    createInstitution
} from '@/controllers/institutionController';
import { protect, authorize } from '@/middleware/auth';

const router = Router();

// Protected routes
router.use(protect);

router.route('/')
    .get(authorize('admin'), getInstitutions)
    .post(authorize('admin'), createInstitution);

router.route('/:id')
    .get(getInstitution);

export default router;