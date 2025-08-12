// controllers/analyticsController.js
import Student from '../models/student.js';
import Professor from '../models/professor.js';
import Branch from '../models/Branch.js';
import Notice from '../models/Notice.js';
import asyncHandler from '../middleware/asyncHandler.js';

export const getDashboardAnalytics = asyncHandler(async (req, res, next) => {
  const [totalStudents, totalProfessors, totalBranches, totalNotices] = await Promise.all([
    Student.countDocuments(),
    Professor.countDocuments(),
    Branch.countDocuments(),
    Notice.countDocuments(),
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalStudents,
      totalProfessors,
      totalBranches,
      totalNotices,
    },
  });
});