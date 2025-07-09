import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { createFacility } from '../controllers/facility.js';

const router = express.Router();

router
  .route('/')
  .post(protect, authorize('admin'), createFacility);

export default router;
