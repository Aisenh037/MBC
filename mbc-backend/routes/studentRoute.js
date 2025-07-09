import express from 'express';
import Student from '../models/Student.js';

const router = express.Router();

// Get all students
router.get('/', async (req, res, next) => {
  try {
    const students = await Student.find().populate('branch');
    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students'
    });
    next(err);
  }
});

// Create a student
router.post('/', async (req, res, next) => {
  try {
    const student = await Student.create(req.body);
    const populatedStudent = await Student.findById(student._id).populate('branch');
    res.status(201).json({
      success: true,
      data: populatedStudent
    });
  } catch (err) {
    console.error('Error creating student:', err);
    res.status(400).json({
      success: false,
      message: err.message
    });
    next(err);
  }
});

// Update a student
router.put('/:id', async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('branch');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (err) {
    console.error('Error updating student:', err);
    res.status(400).json({
      success: false,
      message: err.message
    });
    next(err);
  }
});

// Delete a student
router.delete('/:id', async (req, res, next) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error('Error deleting student:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete student'
    });
    next(err);
  }
});

// Bulk import students
router.post('/bulk-import', async (req, res, next) => {
  try {
    const { branchId, semester, students } = req.body;

    // Validate input
    if (!branchId || !semester || !students || !Array.isArray(students)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input data'
      });
    }

    // Process each student
    const results = await Promise.all(students.map(async (student) => {
      try {
        const newStudent = new Student({
          scholarNumber: student.scholarNumber,
          name: student.name,
          email: student.email,
          mobile: student.mobile,
          branch: branchId,
          currentSemester: semester
        });
        await newStudent.save();
        return { success: true, student: newStudent };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }));

    // Count successful imports
    const successfulImports = results.filter(r => r.success).length;
    const failedImports = results.length - successfulImports;

    res.status(200).json({
      success: true,
      message: `Import completed. Success: ${successfulImports}, Failed: ${failedImports}`,
      results
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during bulk import'
    });
    next(error); // Fixed: Changed next(err) to next(error)
  }
});

export default router;