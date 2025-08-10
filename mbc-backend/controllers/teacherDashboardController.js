// controllers/teacherDashboardController.js
import Teacher from "../models/professor.js";
import Assignment from "../models/Assignment.js";
import Student from "../models/student.js";
import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';


export const getTeacherDashboard = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  const teacher = await Teacher.findOne({ user: userId })
    .populate("user", "name email")
    .populate("subjects")
    .populate("classes");

  if (!teacher) {
    return next(new ErrorResponse("Teacher profile not found for the logged-in user", 404));
  }

  const classIds = teacher.classes.map(c => c._id);
  const totalStudents = await Student.countDocuments({ class: { $in: classIds } });
  const assignments = await Assignment.find({ teacher: teacher._id }).sort({ dueDate: -1 });

  let pendingToGrade = 0;
  for (const assignment of assignments) {
    pendingToGrade += assignment.submissions.filter(s => s.marks == null).length;
  }

  const upcomingAssignments = assignments.filter(a => a.dueDate > new Date());

  res.status(200).json({
    success: true,
    data: {
      teacher,
      totalClasses: teacher.classes.length,
      totalSubjects: teacher.subjects.length,
      totalStudents,
      totalAssignments: assignments.length,
      pendingToGrade,
      upcomingAssignments
    }
  });
});