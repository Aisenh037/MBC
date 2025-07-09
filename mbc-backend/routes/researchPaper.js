import express from 'express';
import {
  getResearchPapers,
  uploadResearchPaper,
  publishResearchPaper,
} from '../controllers/researchPaper.js';

import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router
  .route('/')
  .get(getResearchPapers)
  .post(protect, authorize('professor', 'hod', 'director', 'creator'), uploadResearchPaper);

router
  .route('/:id/publish')
  .put(protect, authorize('hod', 'director', 'creator'), publishResearchPaper);

export default router;
