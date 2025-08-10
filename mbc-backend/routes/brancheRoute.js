// routes/branchRoute.js
import express from 'express';
import {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  getBranchSemesters,
  getBranchSubjects,
  getBranchStudents,
  importStudents
} from '../controllers/branchController.js';
import protect from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';

const router = express.Router();

router.use(protect);
router.use(requireRole('admin')); // All branch operations are admin-only

router.route('/')
  .get(getBranches)
  .post(createBranch);

router.route('/:id')
  .put(updateBranch)
  .delete(deleteBranch);

router.get('/:id/semesters', getBranchSemesters);
router.get('/:id/subjects', getBranchSubjects);
router.get('/:id/students', getBranchStudents);
router.post('/:id/students/import', importStudents);

export default router;