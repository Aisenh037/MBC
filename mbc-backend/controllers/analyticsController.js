// controllers/analyticsController.js
import Student from "../models/student.js";
import Teacher from "../models/professor.js";
import Assignment from "../models/Assignment.js";
import Mark from "../models/Marks.js";
import Class from "../models/Course.js";
import asyncHandler from '../middleware/asyncHandler.js';

export const getAnalytics = asyncHandler(async (req, res, next) => {
  const totalStudents = await Student.countDocuments();
  const totalTeachers = await Teacher.countDocuments();
  const totalAssignments = await Assignment.countDocuments();
  const totalClasses = await Class.countDocuments();

  const marksData = await Mark.aggregate([
    {
      $group: {
        _id: null,
        avg: { $avg: "$marksObtained" },
        max: { $max: "$marksObtained" },
        min: { $min: "$marksObtained" },
        count: { $sum: 1 }
      }
    }
  ]);

  const marksStats = marksData[0] || {};

  res.status(200).json({
    success: true,
    data: {
      totalStudents,
      totalTeachers,
      totalAssignments,
      totalClasses,
      averageMark: marksStats.avg || 0,
      maxMark: marksStats.max || 0,
      minMark: marksStats.min || 0,
      totalMarksRecords: marksStats.count || 0
    }
  });
});