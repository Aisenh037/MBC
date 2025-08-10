// controllers/noticeController.js
import Notice from "../models/Notice.js";
import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';

export const getNotices = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

export const addNotice = asyncHandler(async (req, res, next) => {
  req.body.createdBy = req.user.id;  
  const notice = await Notice.create(req.body);
  res.status(201).json({ success: true, message: "Notice created", data: notice });
});

export const updateNotice = asyncHandler(async (req, res, next) => {
  const updated = await Notice.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) {
    return next(new ErrorResponse(`Notice not found with id ${req.params.id}`, 404));
  }
  res.status(200).json({ success: true, message: "Notice updated", data: updated });
});

export const deleteNotice = asyncHandler(async (req, res, next) => {
  const deleted = await Notice.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return next(new ErrorResponse(`Notice not found with id ${req.params.id}`, 404));
  }
  res.status(200).json({ success: true, message: "Notice deleted" });
});