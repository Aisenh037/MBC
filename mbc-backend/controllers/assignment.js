import Assignment from '../models/Assignment.js';
import Course from '../models/Course.js'; // Add this import for course checking
import ErrorResponse from '../utils/errorResponse.js';
import asyncHandler from '../middleware/asyncHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// @desc    Create assignment
// @route   POST /api/v1/assignments
// @access  Private/Professor
export const createAssignment = asyncHandler(async (req, res, next) => {
  const assignmentData = {
    title: req.body.title,
    description: req.body.description,
    dueDate: req.body.dueDate,
    course: req.body.course,
    createdBy: req.user.id,
  };

  if (req.files && req.files.file) {
    const file = req.files.file;

    const fileTypes = ['application/pdf', 'application/msword'];
    if (!fileTypes.includes(file.mimetype)) {
      return next(new ErrorResponse('Please upload a PDF or DOC file', 400));
    }

    file.name = `assignment_${req.user.id}_${Date.now()}${path.parse(file.name).ext}`;

    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
      if (err) {
        console.error(err);
        return next(new ErrorResponse('Problem with file upload', 500));
      }

      assignmentData.file = file.name;
      const assignment = await Assignment.create(assignmentData);

      res.status(201).json({
        success: true,
        data: assignment,
      });
    });
  } else {
    const assignment = await Assignment.create(assignmentData);
    res.status(201).json({
      success: true,
      data: assignment,
    });
  }
});

// @desc    Submit assignment
// @route   PUT /api/v1/assignments/:id/submit
// @access  Private/Student
export const submitAssignment = asyncHandler(async (req, res, next) => {
  if (!req.files) {
    return next(new ErrorResponse('Please upload a file', 400));
  }

  const file = req.files.file;

  const fileTypes = ['application/pdf', 'application/msword'];
  if (!fileTypes.includes(file.mimetype)) {
    return next(new ErrorResponse('Please upload a PDF or DOC file', 400));
  }

  file.name = `submission_${req.user.id}_${Date.now()}${path.parse(file.name).ext}`;

  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    return next(new ErrorResponse(`Assignment not found with id of ${req.params.id}`, 404));
  }

  const course = await Course.findById(assignment.course);
  if (!course.students.includes(req.user.id)) {
    return next(new ErrorResponse('Not enrolled in this course', 401));
  }

  const existingSubmission = assignment.submissions.find(
    sub => sub.student.toString() === req.user.id
  );
  if (existingSubmission) {
    return next(new ErrorResponse('Already submitted this assignment', 400));
  }

  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse('Problem with file upload', 500));
    }

    assignment.submissions.push({
      student: req.user.id,
      file: file.name,
    });

    await assignment.save();

    res.status(200).json({
      success: true,
      data: assignment,
    });
  });
});

// @desc    Grade assignment
// @route   PUT /api/v1/assignments/:id/grade/:submissionId
// @access  Private/Professor
export const gradeAssignment = asyncHandler(async (req, res, next) => {
  const { grade, feedback } = req.body;

  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    return next(new ErrorResponse(`Assignment not found with id of ${req.params.id}`, 404));
  }

  if (
    assignment.createdBy.toString() !== req.user.id &&
    req.user.role !== 'creator' &&
    req.user.role !== 'director' &&
    req.user.role !== 'hod'
  ) {
    return next(new ErrorResponse('Not authorized to grade this assignment', 401));
  }

  const submissionIndex = assignment.submissions.findIndex(
    sub => sub._id.toString() === req.params.submissionId
  );

  if (submissionIndex === -1) {
    return next(new ErrorResponse(`Submission not found with id of ${req.params.submissionId}`, 404));
  }

  assignment.submissions[submissionIndex].grade = grade;
  assignment.submissions[submissionIndex].feedback = feedback;

  await assignment.save();

  res.status(200).json({
    success: true,
    data: assignment,
  });
});
 