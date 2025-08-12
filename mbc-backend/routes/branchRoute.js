import express from 'express';
import {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from '../controllers/branchController.js';
// Corrected import for consistency
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All branch operations are protected and admin-only
router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getBranches)
  .post(createBranch);

router.route('/:id')
  .put(updateBranch)
  .delete(deleteBranch);

// The unused routes that caused the crash have been removed.

export default router;