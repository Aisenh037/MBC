// controllers/professorController.js
import Teacher from '../models/professor.js';
import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';


export const getTeachers = asyncHandler(async (req, res, next) => {
  const teachers = await Teacher.find().populate('user');
  res.status(200).json({ success: true, count: teachers.length, data: teachers });
});

export const addTeacher = asyncHandler(async (req, res, next) => {
  const { name, email, password, employeeId, department } = req.body;
  const user = await User.create({ name, email, password, role: "professor" });
  const teacher = await Teacher.create({ user: user._id, employeeId, department });
  res.status(201).json({ success: true, message: "Teacher created", data: teacher });
});

export const updateTeacher = asyncHandler(async (req, res, next) => {
  const { name, email, employeeId, department } = req.body;
  const teacher = await Teacher.findById(req.params.id).populate('user'); // TODO: rename variables to professor consistently
  if (!teacher) {
    return next(new ErrorResponse(`Teacher not found with id ${req.params.id}`, 404));
  }
  if (name) teacher.user.name = name;
  if (email) teacher.user.email = email;
  await teacher.user.save();
  teacher.employeeId = employeeId ?? teacher.employeeId;
  teacher.department = department ?? teacher.department;
  await teacher.save();
  res.status(200).json({ success: true, message: "Teacher updated", data: teacher });
});

export const deleteTeacher = asyncHandler(async (req, res, next) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) {
    return next(new ErrorResponse(`Teacher not found with id ${req.params.id}`, 404));
  }
  await User.findByIdAndDelete(teacher.user);
  await teacher.remove();
  res.status(200).json({ success: true, message: "Teacher deleted" });
});