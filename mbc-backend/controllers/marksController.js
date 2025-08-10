// controllers/marksController.js
import Mark from "../models/Marks.js";
import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';


export const getMarks = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

export const addMark = asyncHandler(async (req, res, next) => {
  req.body.teacher = req.user.id;  
  const mark = await Mark.create(req.body);
  res.status(201).json({ success: true, message: "Mark added", data: mark });
});

export const updateMark = asyncHandler(async (req, res, next) => {
  const mark = await Mark.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!mark) {
    return next(new ErrorResponse(`Mark not found with id ${req.params.id}`, 404));
  }
  res.status(200).json({ success: true, message: "Mark updated", data: mark });
});

export const deleteMark = asyncHandler(async (req, res, next) => {
  const deleted = await Mark.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return next(new ErrorResponse(`Mark not found with id ${req.params.id}`, 404));
  }
  res.status(200).json({ success: true, message: "Mark deleted" });
});