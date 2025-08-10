// controllers/subjectController.js
import Subject from '../models/Subject.js';
import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';


export const getAllSubjects = asyncHandler(async (req, res, next) => {
  const subjects = await Subject.find().populate('class').populate('faculty');
  res.status(200).json({ success: true, count: subjects.length, data: subjects });
});

export const getSubjectById = asyncHandler(async (req, res, next) => {
  const subject = await Subject.findById(req.params.id).populate('class').populate('faculty');
  if (!subject) {
    return next(new ErrorResponse(`Subject not found with id ${req.params.id}`, 404));
  }
  res.status(200).json({ success: true, data: subject });
});

export const createSubject = asyncHandler(async (req, res, next) => {
  const subject = await Subject.create(req.body);
  res.status(201).json({ success: true, data: subject });
});

export const updateSubject = asyncHandler(async (req, res, next) => {
  const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!subject) {
    return next(new ErrorResponse(`Subject not found with id ${req.params.id}`, 404));
  }
  res.status(200).json({ success: true, data: subject });
});

export const deleteSubject = asyncHandler(async (req, res, next) => {
  const subject = await Subject.findByIdAndDelete(req.params.id);
  if (!subject) {
    return next(new ErrorResponse(`Subject not found with id ${req.params.id}`, 404));
  }
  res.status(200).json({ success: true, message: 'Subject deleted' });
});