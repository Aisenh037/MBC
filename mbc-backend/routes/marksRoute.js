// routes/marksRoute.js
import express from "express";
import { getMarks, addMark, updateMark, deleteMark } from "../controllers/marksController.js";
import protect from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getMarks)
    .post(requireRole('teacher', 'admin'), addMark);

router.route('/:id')
    .put(requireRole('teacher', 'admin'), updateMark)
    .delete(requireRole('teacher', 'admin'), deleteMark);

export default router;