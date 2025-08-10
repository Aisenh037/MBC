// routes/studentRoute.js
import express from 'express';
import { getStudents, addStudent } from '../controllers/studentController.js';
import protect from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';
import Student from '../models/student.js';
import advancedResults from '../middleware/advancedResults.js';

const router = express.Router();

router.use(protect);

router.route('/')
    .get(requireRole('admin', 'teacher'), advancedResults(Student, 'user'), getStudents)
    .post(requireRole('admin'), addStudent);

export default router;