import path from 'path';
import User from '../models/user.js';
import ErrorResponse from '../utils/errorResponse.js';
import asyncHandler from '../middleware/asyncHandler.js';

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private/Admin
export const getUsers = asyncHandler(async (req, res, next) => {
  const reqQuery = { ...req.query };
  const removeFields = ['select', 'sort', 'page', 'limit'];
  removeFields.forEach(param => delete reqQuery[param]);

  let queryStr = JSON.stringify(reqQuery).replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
  let query = User.find(JSON.parse(queryStr));

  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  if (req.query.sort) {
    query = query.sort(req.query.sort.split(',').join(' '));
  } else {
    query = query.sort('-createdAt');
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await User.countDocuments();

  query = query.skip(startIndex).limit(limit);
  const users = await query;

  const pagination = {};
  if (endIndex < total) pagination.next = { page: page + 1, limit };
  if (startIndex > 0) pagination.prev = { page: page - 1, limit };

  res.status(200).json({ success: true, count: users.length, pagination, data: users });
});

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Private/Admin
export const getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));

  const unauthorized =
    req.user.role !== 'creator' &&
    req.user.role !== 'director' &&
    (req.user.role === 'hod' && user.department !== req.user.department) &&
    user._id.toString() !== req.user.id;

  if (unauthorized) return next(new ErrorResponse(`Not authorized to view this user`, 401));

  res.status(200).json({ success: true, data: user });
});

// @desc    Create user
// @route   POST /api/v1/users
// @access  Private/Admin
export const createUser = asyncHandler(async (req, res, next) => {
  const { role } = req.body;

  if (['creator', 'director', 'hod'].includes(role) && req.user.role !== 'creator') {
    return next(new ErrorResponse(`You are not authorized to create users with ${role} role`, 403));
  }

  if (role === 'professor' && !['creator', 'director', 'hod'].includes(req.user.role)) {
    return next(new ErrorResponse(`You are not authorized to create professor accounts`, 403));
  }

  const user = await User.create(req.body);

  res.status(201).json({ success: true, data: user });
});

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
export const updateUser = asyncHandler(async (req, res, next) => {
  let user = await User.findById(req.params.id);
  if (!user) return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));

  const unauthorized =
    req.user.role !== 'creator' &&
    req.user.role !== 'director' &&
    (req.user.role === 'hod' && user.department !== req.user.department) &&
    user._id.toString() !== req.user.id;

  if (unauthorized) return next(new ErrorResponse(`Not authorized to update this user`, 401));

  const role = req.body.role;

  if (role) {
    if (req.user.role !== 'creator' && ['creator', 'director', 'hod'].includes(role)) {
      return next(new ErrorResponse(`You are not authorized to assign ${role} role`, 403));
    }

    if (req.user.role === 'hod' && role === 'professor') {
      return next(new ErrorResponse(`You are not authorized to assign professor role`, 403));
    }
  }

  user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({ success: true, data: user });
});

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));

  const unauthorized =
    req.user.role !== 'creator' &&
    req.user.role !== 'director' &&
    (req.user.role === 'hod' && user.department !== req.user.department);

  if (unauthorized) return next(new ErrorResponse(`Not authorized to delete this user`, 401));

  if (user.role === 'creator') {
    return next(new ErrorResponse(`Creator accounts cannot be deleted`, 403));
  }

  await user.remove();
  res.status(200).json({ success: true, data: {} });
});

// @desc    Upload user photo
// @route   PUT /api/v1/users/:id/photo
// @access  Private
export const uploadUserPhoto = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));

  const unauthorized =
    req.user.role !== 'creator' &&
    req.user.role !== 'director' &&
    (req.user.role === 'hod' && user.department !== req.user.department) &&
    user._id.toString() !== req.user.id;

  if (unauthorized) return next(new ErrorResponse(`Not authorized to update this user`, 401));

  if (!req.files) return next(new ErrorResponse(`Please upload a file`, 400));

  const file = req.files.file;

  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse(`Please upload an image file`, 400));
  }

  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(new ErrorResponse(`Image must be smaller than ${process.env.MAX_FILE_UPLOAD}`, 400));
  }

  file.name = `photo_${user._id}${path.extname(file.name)}`;

  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse(`Problem with file upload`, 500));
    }

    await User.findByIdAndUpdate(req.params.id, { photo: file.name });

    res.status(200).json({
      success: true,
      data: file.name
    });
  });
});
