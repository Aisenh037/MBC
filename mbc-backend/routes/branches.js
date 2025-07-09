import express from 'express';
import {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  getBranchDetails,
  getBranchSemesters,
  getBranchSubjects,
  getBranchStudents,
  importStudents
} from '../controllers/branchController.js';

const router = express.Router();

router.route('/')
  .get(getBranches)
  .post(createBranch);

router.route('/:id')
  .put(updateBranch)
  .delete(deleteBranch);

router.route('/:id/semesters')
  .get(getBranchSemesters);

router.route('/:id/subjects')
  .get(getBranchSubjects);

router.route('/:id/students')
  .get(getBranchStudents);

router.route('/:id/students/import')
  .post(importStudents);

export default router;