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
import { protect, authorize } from '../middleware/auth.js';
import advancedResults from '../middleware/advancedResults.js';
import Student from '../models/student.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);

router.route('/')
  .get(authorize('admin', 'professor'), advancedResults(Student, ['user', 'branch']), (req, res, next) => {
    console.log('Processing GET /students', { user: req.user });
    getStudents(req, res, next);
  })
  .post(authorize('admin'), addStudent);

router.post('/bulk-import', authorize('admin'), upload.single('file'), bulkImportStudents);
router.get('/bulk-export', authorize('admin'), bulkExport);

router.route('/:id')
  .put(authorize('admin'), updateStudent)
  .delete(authorize('admin'), deleteStudent);

router.post('/:id/send-reset-link', authorize('admin'), sendResetLink);

export default router;