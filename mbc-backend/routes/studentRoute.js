import express from 'express';
import { getStudents, addStudent } from '../controllers/studentController.js';
import requireAuth from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';
const router = express.Router();

router.get("/", requireAuth, requireRole(['admin', 'teacher']), getStudents);
router.post("/", requireAuth, requireRole(['admin']), addStudent);

export default router;
