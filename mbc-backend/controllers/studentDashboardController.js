// controllers/studentDashboardController.js
import Student from "../models/student.js";
import Mark from "../models/Marks.js";
import Assignment from "../models/Assignment.js";
import Notice from "../models/Notice.js";
import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';


export const getStudentDashboard = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  const student = await Student.findOne({ user: userId })
    .populate("user", "name email")
    .populate("class")
    .populate("subjects");

  if (!student) {
    return next(new ErrorResponse("Student profile not found for the logged-in user", 404));
  }

  const marks = await Mark.find({ student: student._id }).populate("subject", "name code");

  const assignments = await Assignment.find({ class: student.class })
    .populate("subject", "name")
    .populate("teacher", "name")
    .sort({ dueDate: -1 });

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