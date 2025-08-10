// controllers/assignmentController.js
import Assignment from '../models/Assignment.js';
import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';


export const getAssignments = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

export const addAssignment = asyncHandler(async (req, res, next) => {
  const { title, description, subject, class: classId, dueDate } = req.body;
  req.body.teacher = req.user.id;  
  const assignment = await Assignment.create(req.body);
  res.status(201).json({ success: true, message: "Assignment created", data: assignment });
});

export const updateAssignment = asyncHandler(async (req, res, next) => {
  const updated = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) {
    return next(new ErrorResponse(`Assignment not found with id ${req.params.id}`, 404));
  }
  res.status(200).json({ success: true, message: "Assignment updated", data: updated });
});

export const deleteAssignment = asyncHandler(async (req, res, next) => {
  const deleted = await Assignment.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return next(new ErrorResponse(`Assignment not found with id ${req.params.id}`, 404));
  }
  res.status(200).json({ success: true, message: "Assignment deleted" });
});

export const submitAssignment = asyncHandler(async (req, res, next) => {
  const { id } = req.params;  
  const { file } = req.body;  
  const studentId = req.user.id;
  const assignment = await Assignment.findById(id);

  if (!assignment) {
    return next(new ErrorResponse(`Assignment not found with id ${id}`, 404));
  }

  // Check if already submitted
  const existingSubmission = assignment.submissions.find(s => s.student.toString() === studentId);
  if (existingSubmission) {
    return next(new ErrorResponse('You have already submitted this assignment', 400));
  }

  assignment.submissions.push({
    student: studentId,
    file,
    submittedAt: new Date()
  });

  await assignment.save();
  res.status(200).json({ success: true, message: "Assignment submitted" });
});

export const gradeSubmission = asyncHandler(async (req, res, next) => {
  const { id, submissionId } = req.params;
  const { marks, remarks } = req.body;
  const assignment = await Assignment.findById(id);

  if (!assignment) {
    return next(new ErrorResponse(`Assignment not found with id ${id}`, 404));
  }

  const submission = assignment.submissions.id(submissionId);
  if (!submission) {
    return next(new ErrorResponse(`Submission not found with id ${submissionId}`, 404));
  }

  submission.marks = marks;
  submission.remarks = remarks;
  await assignment.save();
  res.status(200).json({ success: true, message: "Submission graded" });
});