import express from 'express';
import {
  uploadStudyMaterial,
  getStudyMaterials,
  deleteStudyMaterial,
} from '../controllers/studyMaterial.js';

import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router
  .route('/')
  .get(protect, getStudyMaterials)
  .post(protect, authorize('professor', 'hod', 'director', 'creator'), uploadStudyMaterial);

router
  .route('/:id')
  .delete(protect, authorize('professor', 'hod', 'director', 'creator'), deleteStudyMaterial);

export default router;
