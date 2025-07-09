import Student from '../models/Student.js';

// @desc    Get all students
// @route   GET /api/v1/students
export const getStudents = async (req, res, next) => {
  try {
    const students = await Student.find().populate('branch').populate('hostel');
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
};

// @desc    Create new student
// @route   POST /api/v1/students
export const createStudent = async (req, res, next) => {
  try {
    const student = await Student.create(req.body);
    const populatedStudent = await Student.findById(student._id)
      .populate('branch')
      .populate('hostel');
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
};

// @desc    Update student
// @route   PUT /api/v1/students/:id
export const updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('branch')
      .populate('hostel');

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
};

// @desc    Delete student
// @route   DELETE /api/v1/students/:id
export const deleteStudent = async (req, res, next) => {
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
};