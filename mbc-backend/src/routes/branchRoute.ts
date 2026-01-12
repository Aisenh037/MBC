import { Router } from 'express';
import {
    getBranches,
    getBranch,
    createBranch,
    updateBranch,
    deleteBranch
} from '@/controllers/branchController';
import { protect, authorize } from '@/middleware/auth';

const router = Router();

// Protected routes
router.use(protect);

router.route('/')
    .get(getBranches)
    .post(authorize('admin'), createBranch);

router.route('/:id')
    .get(getBranch)
    .put(authorize('admin'), updateBranch)
    .delete(authorize('admin'), deleteBranch);

export default router;