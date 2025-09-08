import express from 'express';
import {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from '../controllers/branchController.js';
import { protect, authorize } from '../middleware/auth.js';
import advancedResults from '../middleware/advancedResults.js';
import Branch from '../models/Branch.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(advancedResults(Branch), getBranches)
  .post(createBranch);

router.route('/:id')
  .put(updateBranch)
  .delete(deleteBranch);

export default router;