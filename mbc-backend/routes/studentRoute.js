// routes/studentRoute.js
import express from 'express';
import multer from 'multer';
import {
  getStudents,
  addStudent,
  updateStudent,
  deleteStudent,
  bulkImportStudents,
  bulkExport,
  sendResetLink,
} from '../controllers/studentController.js';

// --- Correct Middleware Imports ---
import { protect, authorize } from '../middleware/auth.js';
import advancedResults from '../middleware/advancedResults.js';
import Student from '../models/student.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Protect all routes below this line
router.use(protect);

router.route('/')
  .get(authorize('admin', 'professor'), advancedResults(Student, ['user', 'branch']), getStudents)
  .post(authorize('admin'), addStudent);

router.route('/bulk-import')
  .post(authorize('admin'), upload.single('file'), bulkImportStudents);

router.route('/bulk-export')
  .get(authorize('admin'), bulkExport);

router.route('/:id')
  .put(authorize('admin'), updateStudent)
  .delete(authorize('admin'), deleteStudent);

router.post('/:id/send-reset-link', authorize('admin'), sendResetLink);

export default router;