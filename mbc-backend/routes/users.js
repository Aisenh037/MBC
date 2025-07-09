import express from 'express';
import Subject from '../models/Subject.js';

const router = express.Router();

// Get all subjects
router.get('/', async (req, res) => {
  try {
    const subjects = await Subject.find().populate('branch');
    res.json(subjects);
  } catch (err) {
    console.error('Error fetching subjects:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;