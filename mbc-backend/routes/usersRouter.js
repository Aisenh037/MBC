import express from 'express';
import auth from '../middleware/auth.js';
import requireRole from '../middleware/role.js';

const router = express.Router();

router.get('/admin-only', auth, requireRole('admin'), (req, res) => {
  res.json({ message: 'Welcome, Admin!' });
});
router.get('/teacher-only', auth, requireRole('teacher'), (req, res) => {
  res.json({ message: 'Welcome, Teacher!' });
});
router.get('/student-only', auth, requireRole('student'), (req, res) => {
  res.json({ message: 'Welcome, Student!' });
});

export default router;
