import mongoose from 'mongoose';
import Student from '../models/student.js';
import Professor from '../models/professor.js';
import Branch from '../models/Branch.js';
import Notice from '../models/Notice.js';
import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';

export const getDashboardAnalytics = asyncHandler(async (req, res, next) => {
  try {
    // Log authenticated user for debugging
    console.log('Authenticated user:', req.user ? req.user : 'No user');

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      throw new ErrorResponse('MongoDB not connected', 500);
    }

    // Verify model registration
    const models = { Student, Professor, Branch, Notice };
    for (const [name, model] of Object.entries(models)) {
      if (!model || !mongoose.modelNames().includes(name)) {
        throw new ErrorResponse(`Model ${name} not found`, 500);
      }
    }

    // Check collection existence
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);
    for (const name of Object.keys(models)) {
      if (!collectionNames.includes(name.toLowerCase())) {
        console.warn(`Collection ${name} not found, returning 0 count`);
      }
    }

    const [totalStudents, totalProfessors, totalBranches, totalNotices] = await Promise.all([
      Student.countDocuments().catch((err) => {
        console.error('Student count error:', err);
        return 0;
      }),
      Professor.countDocuments().catch((err) => {
        console.error('Professor count error:', err);
        return 0;
      }),
      Branch.countDocuments().catch((err) => {
        console.error('Branch count error:', err);
        return 0;
      }),
      Notice.countDocuments().catch((err) => {
        console.error('Notice count error:', err);
        return 0;
      }),
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
  } catch (error) {
    console.error('Analytics query error:', error);
    next(error);
  }
});