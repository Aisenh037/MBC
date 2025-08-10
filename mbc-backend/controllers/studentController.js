// controllers/studentController.js
import Student from '../models/student.js';
import User from '../models/user.js';
import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';


export const getStudents = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);  
});

export const addStudent = asyncHandler(async (req, res, next) => {
  const { name, email, password, scholarNo } = req.body;

  // Checking user with that email already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return next(new ErrorResponse('A user with this email already exists', 400));
  }

  const user = await User.create({ name, email, password, role: "student" });
  const student = await Student.create({ user: user._id, scholarNo });
  res.status(201).json({ success: true, message: "Student created", data: student });
});