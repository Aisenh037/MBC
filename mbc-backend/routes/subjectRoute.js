import express from 'express';
import Subject from '../models/Subject.js';

const router = express.Router();

// Get all subjects
router.get('/', async (req, res) => {
  try {
    const subjects = await Subject.find().populate('branch');
    res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects
    });
  } catch (err) {
    console.error('Error fetching subjects:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subjects'
    });
  }
});

export default router;