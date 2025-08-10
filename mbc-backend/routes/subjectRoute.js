// routes/subjectRoute.js
import express from 'express';
import {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject
} from '../controllers/subjectController.js';
import protect from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';

const router = express.Router();

router.use(protect);

// Admins and teachers can see subjects
router.get('/', requireRole('admin', 'teacher'), getAllSubjects);
router.get('/:id', requireRole('admin', 'teacher'), getSubjectById);

// Only admins can create, update, or delete subjects
router.post('/', requireRole('admin'), createSubject);
router.put('/:id', requireRole('admin'), updateSubject);
router.delete('/:id', requireRole('admin'), deleteSubject);

export default router;