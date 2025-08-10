// controllers/attendenceController.js
import Attendance from '../models/Attendence.js';
import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';


export const getAttendance = asyncHandler(async (req, res, next) => {
  const { studentId, subjectId } = req.query;
  let query = {};
  if (studentId) query.student = studentId;
  if (subjectId) query.subject = subjectId;
  const attendance = await Attendance.find(query).populate('student subject faculty');
  res.status(200).json({ success: true, count: attendance.length, data: attendance });
});

export const markAttendance = asyncHandler(async (req, res, next) => {
  const { student, subject, date, status } = req.body;
  req.body.faculty = req.user.id;  

  const attendance = await Attendance.findOneAndUpdate(
    { student, subject, date },
    { status, faculty: req.body.faculty },
    { new: true, upsert: true, runValidators: true }
  );
  res.status(200).json({ success: true, data: attendance });
});