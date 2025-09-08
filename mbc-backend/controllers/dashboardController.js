import Student from '../models/student.js';
import Mark from '../models/Marks.js';
import Assignment from '../models/Assignment.js';
import Notice from '../models/Notice.js';
import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';

// @desc    Get data for the student dashboard
// @route   GET /api/v1/dashboards/student
export const getStudentDashboard = asyncHandler(async (req, res, next) => {
  const student = await Student.findOne({ user: req.user.id });
  if (!student) {
    return next(new ErrorResponse("Student profile not found for the logged-in user", 404));
  }

  const marks = await Mark.find({ student: student._id }).populate("subject", "name code");
  const assignments = await Assignment.find({ class: student.class }).sort({ dueDate: -1 });
  const notices = await Notice.find({
    $or: [
      { target: "all" },
      { target: "students" },
      { class: student.class }
    ]
  }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: {
      student,
      marks,
      assignments,
      notices
    }
  });
});

// You can add getProfessorDashboard here later following the same pattern

// @desc    Get data for the professor dashboard
// @route   GET /api/v1/dashboards/professor
export const getProfessorDashboard = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {
      message: "Professor dashboard data will be implemented soon"
    }
  });
});
