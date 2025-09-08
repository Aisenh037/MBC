import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';
import mongoose from 'mongoose';
import Student from '../models/student.js';
import csv from 'fast-csv';
import {
  createStudentAndUser,
  updateStudentAndUser,
  deleteStudentAndUser,
  sendPasswordResetLink,
  exportStudentsToCsv,
} from '../services/studentService.js';

// @desc    Get all students
// @route   GET /api/v1/students
export const getStudents = asyncHandler(async (req, res, next) => {
  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      throw new ErrorResponse('MongoDB not connected', 500);
    }

    // Verify Student model
    if (!mongoose.modelNames().includes('Student')) {
      throw new ErrorResponse('Student model not found', 500);
    }

    // Check if advancedResults ran
    if (res.advancedResults?.data) {
      return res.status(200).json(res.advancedResults);
    }

    // Fallback query
    const students = await Student.find()
      .populate({ path: 'user', select: 'name email' })
      .populate({ path: 'branch', select: 'name' })
      .lean()
      .catch((err) => {
        console.error('Student query error:', err);
        throw new ErrorResponse(`Database query failed: ${err.message}`, 500);
      });

    return res.status(200).json({
      success: true,
      count: students.length,
      data: students || [],
    });
  } catch (error) {
    console.error('Get students error:', {
      message: error.message,
      stack: error.stack,
      user: req.user || 'No user',
    });
    next(error);
  }
});

// Other functions (unchanged for brevity, but aligned with error handling)
export const addStudent = asyncHandler(async (req, res, next) => {
  try {
    const student = await createStudentAndUser(req.body);
    res.status(201).json({ success: true, data: student });
  } catch (error) {
    console.error('Add student error:', error);
    next(new ErrorResponse(`Failed to add student: ${error.message}`, 400));
  }
});

export const updateStudent = asyncHandler(async (req, res, next) => {
  try {
    const student = await updateStudentAndUser(req.params.id, req.body);
    if (!student) {
      throw new ErrorResponse(`Student with ID ${req.params.id} not found`, 404);
    }
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    console.error('Update student error:', error);
    next(error);
  }
});

export const deleteStudent = asyncHandler(async (req, res, next) => {
  try {
    const result = await deleteStudentAndUser(req.params.id);
    if (!result) {
      throw new ErrorResponse(`Student with ID ${req.params.id} not found`, 404);
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Delete student error:', error);
    next(error);
  }
});

export const sendResetLink = asyncHandler(async (req, res, next) => {
  try {
    await sendPasswordResetLink(req.params.id);
    res.status(200).json({ success: true, message: 'Password reset link sent successfully.' });
  } catch (error) {
    console.error('Send reset link error:', error);
    next(new ErrorResponse(`Failed to send reset link: ${error.message}`, 400));
  }
});

export const bulkImportStudents = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorResponse('Please upload a CSV file.', 400));
  }

  try {
    const results = [];
    const errors = [];

    const stream = csv.parseString(req.file.buffer.toString(), { headers: true })
      .on('error', (err) => next(new ErrorResponse(`CSV parsing error: ${err.message}`, 400)))
      .on('data', (row) => results.push(row))
      .on('end', async () => {
        for (const studentData of results) {
          try {
            await createStudentAndUser(studentData);
          } catch (error) {
            errors.push(`Error on row for ${studentData.email || 'unknown'}: ${error.message}`);
          }
        }
        res.status(200).json({
          success: true,
          message: `Processed ${results.length} rows.`,
          successfulImports: results.length - errors.length,
          errors,
        });
      });

    stream.write(req.file.buffer);
    stream.end();
  } catch (error) {
    console.error('Bulk import error:', error);
    next(new ErrorResponse(`Bulk import failed: ${error.message}`, 500));
  }
});

export const bulkExport = asyncHandler(async (req, res, next) => {
  try {
    const csvData = await exportStudentsToCsv();
    res.header('Content-Type', 'text/csv');
    res.attachment('students.csv');
    res.send(csvData);
  } catch (error) {
    console.error('Bulk export error:', error);
    next(new ErrorResponse(`Export failed: ${error.message}`, 500));
  }
});