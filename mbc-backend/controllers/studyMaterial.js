import path from 'path';
import StudyMaterial from '../models/studyMaterial.js';
import ErrorResponse from '../utils/errorResponse.js';
import asyncHandler from '../middleware/asyncHandler.js';

// @desc    Upload study material
// @route   POST /api/v1/studymaterials
// @access  Private/Professor
export const uploadStudyMaterial = asyncHandler(async (req, res, next) => {
  if (!req.files || !req.files.file) {
    return next(new ErrorResponse('Please upload a file', 400));
  }

  const file = req.files.file;

  // Acceptable MIME types
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.ms-powerpoint',
    'video/mp4'
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return next(new ErrorResponse('Only PDF, DOC, PPT, or MP4 files are allowed', 400));
  }

  // Build custom filename
  const ext = path.extname(file.name);
  file.name = `studymaterial_${req.user.id}${ext}`;

  // Save file to server
  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse('Problem with file upload', 500));
    }

    const studyMaterial = await StudyMaterial.create({
      title: req.body.title,
      description: req.body.description,
      file: file.name,
      fileType: ext.substring(1),
      department: req.body.department || req.user.department,
      course: req.body.course,
      uploadedBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: studyMaterial,
    });
  });
});

// @desc    Get all study materials
// @route   GET /api/v1/studymaterials
// @access  Private
export const getStudyMaterials = asyncHandler(async (req, res, next) => {
  let query;

  if (req.params.courseId) {
    query = StudyMaterial.find({ course: req.params.courseId });
  } else if (req.user.role === 'student') {
    query = StudyMaterial.find({ department: req.user.department });
  } else {
    query = StudyMaterial.find();
  }

  const studyMaterials = await query
    .populate('uploadedBy', 'name email')
    .populate('course', 'name code');

  res.status(200).json({
    success: true,
    count: studyMaterials.length,
    data: studyMaterials,
  });
});

// @desc    Delete study material
// @route   DELETE /api/v1/studymaterials/:id
// @access  Private/Professor/Admin
export const deleteStudyMaterial = asyncHandler(async (req, res, next) => {
  const studyMaterial = await StudyMaterial.findById(req.params.id);

  if (!studyMaterial) {
    return next(
      new ErrorResponse(`Study material not found with id of ${req.params.id}`, 404)
    );
  }

  // Only uploader, creator, or director can delete
  const authorized =
    studyMaterial.uploadedBy.toString() === req.user.id ||
    ['creator', 'director'].includes(req.user.role);

  if (!authorized) {
    return next(
      new ErrorResponse(`User not authorized to delete this study material`, 401)
    );
  }

  await studyMaterial.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});
