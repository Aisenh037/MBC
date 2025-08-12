// routes/noticeRoute.js
import express from "express";
import { getNotices, addNotice, updateNotice, deleteNotice } from "../controllers/noticeController.js";
import { protect, authorize } from "../middleware/auth.js"; // Correctly import authorize

const router = express.Router();

// All routes are protected and require a user to be logged in
router.use(protect);

router.route('/')
    .get(getNotices)
    // Only admins and professors can create a notice
    .post(authorize('admin', 'professor'), addNotice);

router.route('/:id')
    // FIX: Replaced requireRole with authorize
    .put(authorize('admin', 'professor'), updateNotice)
    // FIX: Replaced requireRole with authorize
    .delete(authorize('admin', 'professor'), deleteNotice);

export default router;