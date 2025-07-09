import express from 'express';
import Professor from '../models/professor.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Get all professors
router.get('/', async (req, res) => {
  try {
    const professors = await Professor.find()
      .populate('assignedBranches')
      .populate('assignedSubjects.subject')
      .populate('assignedSubjects.branch');
    res.json(professors);
  } catch (err) {
    console.error('Error fetching professors:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add professor
router.post('/', async (req, res) => {
  try {
    const { name, email, department, contact, password, assignedBranches } = req.body;
    const existing = await Professor.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Professor already exists' });

    const professor = new Professor({
      name,
      email,
      department: department || 'MBC',
      contact,
      password,
      assignedBranches: assignedBranches || []
    });
    await professor.save();
    const populatedProfessor = await Professor.findById(professor._id)
      .populate('assignedBranches')
      .populate('assignedSubjects.subject')
      .populate('assignedSubjects.branch');
    res.status(201).json({ message: 'Professor created', professor: populatedProfessor });
  } catch (err) {
    console.error('Error adding professor:', err);
    res.status(400).json({ message: err.message });
  }
});

// Update professor
router.put('/:id', async (req, res) => {
  try {
    const { name, email, department, contact, password, assignedBranches } = req.body;
    const updateData = {
      name,
      email,
      department: department || 'MBC',
      contact,
      assignedBranches: assignedBranches || []
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const professor = await Professor.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    })
      .populate('assignedBranches')
      .populate('assignedSubjects.subject')
      .populate('assignedSubjects.branch');

    if (!professor) return res.status(404).json({ message: 'Professor not found' });
    res.json({ message: 'Professor updated', professor });
  } catch (err) {
    console.error('Error updating professor:', err);
    res.status(400).json({ message: err.message });
  }
});

// Delete professor
router.delete('/:id', async (req, res) => {
  try {
    const professor = await Professor.findByIdAndDelete(req.params.id);
    if (!professor) return res.status(404).json({ message: 'Professor not found' });
    res.json({ message: 'Professor deleted' });
  } catch (err) {
    console.error('Error deleting professor:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign subject to professor
router.post('/:id/assign', async (req, res) => {
  try {
    const { subjectId, semester, branchId } = req.body;
    const professor = await Professor.findById(req.params.id);
    if (!professor) return res.status(404).json({ message: 'Professor not found' });

    professor.assignedSubjects.push({
      subject: subjectId,
      semester,
      branch: branchId
    });
    await professor.save();

    const updatedProfessor = await Professor.findById(req.params.id)
      .populate('assignedBranches')
      .populate('assignedSubjects.subject')
      .populate('assignedSubjects.branch');

    res.json({ message: 'Subject assigned successfully', professor: updatedProfessor });
  } catch (err) {
    console.error('Error assigning subject:', err);
    res.status(400).json({ message: err.message });
  }
});

// Professor login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const prof = await Professor.findOne({ email });
    if (!prof) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, prof.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: prof._id, role: 'professor' },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: prof._id,
        name: prof.name,
        email: prof.email,
        isFirstLogin: prof.firstLogin
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const passwordValid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(newPassword);
    if (!passwordValid) {
      return res.status(400).json({
        message: 'Password must be 8+ characters, include uppercase, lowercase, number, and symbol'
      });
    }

    const prof = await Professor.findOne({ email });
    if (!prof) return res.status(404).json({ message: 'Professor not found' });

    prof.password = newPassword; // Hashed by pre-save hook
    prof.firstLogin = false;
    await prof.save();

    res.json({ message: 'Password updated successfully' });
  }
  catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});