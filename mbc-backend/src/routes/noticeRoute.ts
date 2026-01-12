import { Router } from 'express';
import {
    getNotices,
    getNotice,
    createNotice,
    updateNotice,
    deleteNotice,
    getMyNotices
} from '@/controllers/noticeController';
import { protect, authorize } from '@/middleware/auth';

const router = Router();

// Protected routes
router.use(protect);

router.get('/my-notices', getMyNotices);

router.route('/')
    .get(getNotices)
    .post(authorize('admin', 'professor'), createNotice);

router.route('/:id')
    .get(getNotice)
    .put(authorize('admin', 'professor'), updateNotice)
    .delete(authorize('admin', 'professor'), deleteNotice);

export default router;