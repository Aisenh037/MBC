// controllers/usersController.js
import path from 'path';
import User from '../models/user.js';
import ErrorResponse from '../utils/errorResponse.js';
import asyncHandler from '../middleware/asyncHandler.js';

// @desc    Get current logged in user
// @route   GET /api/v1/users/me
export const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  res.status(200).json({ success: true, data: user });
});

// @desc    Get all users
// @route   GET /api/v1/users
export const getUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single user
// @route   GET /api/v1/users/:id
export const getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  // ✨ FIX: Corrected authorization logic
  const isCreatorOrDirector = ['creator', 'director'].includes(req.user.role);
  const isHodOfSameDept = req.user.role === 'hod' && user.department?.toString() === req.user.department?.toString();
  const isOwnProfile = user._id.toString() === req.user.id;
  const isAuthorized = isCreatorOrDirector || isHodOfSameDept || isOwnProfile;

  if (!isAuthorized) {
    return next(new ErrorResponse(`Not authorized to view this user`, 403));
  }

  res.status(200).json({ success: true, data: user });
});

// @desc    Create user
// @route   POST /api/v1/users
export const createUser = asyncHandler(async (req, res, next) => {
  if (['creator', 'director', 'hod'].includes(req.body.role) && req.user.role !== 'creator') {
    return next(new ErrorResponse(`You are not authorized to create users with ${req.body.role} role`, 403));
  }
  if (req.body.role === 'professor' && !['creator', 'director', 'hod'].includes(req.user.role)) {
    return next(new ErrorResponse(`You are not authorized to create professor accounts`, 403));
  }

  const user = await User.create(req.body);
  res.status(201).json({ success: true, data: user });
});

// @desc    Update user details
// @route   PUT /api/v1/users/:id
export const updateUser = asyncHandler(async (req, res, next) => {
  let user = await User.findById(req.params.id);
  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  // ✨ FIX: Corrected authorization logic
  const isCreatorOrDirector = ['creator', 'director'].includes(req.user.role);
  const isHodOfSameDept = req.user.role === 'hod' && user.department?.toString() === req.user.department?.toString();
  const isOwnProfile = user._id.toString() === req.user.id;
  const isAuthorized = isCreatorOrDirector || isHodOfSameDept || isOwnProfile;

  if (!isAuthorized) {
    return next(new ErrorResponse(`Not authorized to update this user`, 403));
  }

  user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  res.status(200).json({ success: true, data: user });
});

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
export const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  // ✨ FIX: Corrected authorization logic
  const isCreatorOrDirector = ['creator', 'director'].includes(req.user.role);
  const isHodOfSameDept = req.user.role === 'hod' && user.department?.toString() === req.user.department?.toString();
  const isAuthorized = isCreatorOrDirector || isHodOfSameDept;

  if (!isAuthorized) {
    return next(new ErrorResponse(`Not authorized to delete this user`, 403));
  }
  if (user.role === 'creator') {
    return next(new ErrorResponse(`Creator accounts cannot be deleted`, 403));
  }

  await User.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, data: {} });
});

// @desc    Upload user photo
// @route   PUT /api/v1/users/:id/photo
export const uploadUserPhoto = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  const isAuthorized = user._id.toString() === req.user.id || ['creator', 'director'].includes(req.user.role);
  if (!isAuthorized) {
    return next(new ErrorResponse(`Not authorized to update this user's photo`, 403));
  }

  if (!req.files) {
    return next(new ErrorResponse(`Please upload a file`, 400));
  }

  const file = req.files.file;
  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse(`Please upload an image file`, 400));
  }
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(new ErrorResponse(`Image must be smaller than ${process.env.MAX_FILE_UPLOAD / 1000000}MB`, 400));
  }

  file.name = `photo_${user._id}${path.extname(file.name)}`;
  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse(`Problem with file upload`, 500));
    }
    await User.findByIdAndUpdate(req.params.id, { photo: file.name });
    res.status(200).json({ success: true, data: file.name });
  });
});