// routes/noticeRoute.js
import express from "express";
import { getNotices, addNotice, updateNotice, deleteNotice } from "../controllers/noticeController.js";
import protect from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getNotices)
    .post(requireRole('admin', 'teacher'), addNotice);

router.route('/:id')
    .put(requireRole('admin', 'teacher'), updateNotice)
    .delete(requireRole('admin', 'teacher'), deleteNotice);

export default router;