import express from 'express';
import { getAttendance, markAttendance } from '../controllers/attendenceController.js';

const router = express.Router();

router.get('/', getAttendance);
router.post('/', markAttendance);

export default router;