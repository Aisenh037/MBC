const Course = require('../models/Course');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all courses
// @route   GET /api/v1/courses
// @route   GET /api/v1/departments/:departmentId/courses
// @access  Public
exports.getCourses = asyncHandler(async (req, res, next) => {
  if (req.params.departmentId) {
    const courses = await Course.find({ department: req.params.departmentId });
    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc    Get single course
// @route   GET /api/v1/courses/:id
// @access  Public
exports.getCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id).populate('faculty students');

  if (!course) {
    return next(
      new ErrorResponse(`Course not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: course,
  });
});

// @desc    Add course
// @route   POST /api/v1/courses
// @access  Private/Admin
exports.addCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.create(req.body);

  res.status(201).json({
    success: true,
    data: course,
  });
});

// @desc    Update course
// @route   PUT /api/v1/courses/:id
// @access  Private/Admin
exports.updateCourse = asyncHandler(async (req, res, next) => {
  let course = await Course.findById(req.params.id);

  if (!course) {
    return next(
      new ErrorResponse(`Course not found with id of ${req.params.id}`, 404)
    );
  }

  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: course,
  });
});

// @desc    Delete course
// @route   DELETE /api/v1/courses/:id
// @access  Private/Admin
exports.deleteCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(
      new ErrorResponse(`Course not found with id of ${req.params.id}`, 404)
    );
  }

  await course.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Enroll student in course
// @route   POST /api/v1/courses/:id/enroll
// @access  Private
exports.enrollStudent = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(
      new ErrorResponse(`Course not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if student is already enrolled
  if (course.students.includes(req.user.id)) {
    return next(new ErrorResponse('Student already enrolled in this course', 400));
  }

  course.students.push(req.user.id);
  await course.save();

  res.status(200).json({
    success: true,
    data: course,
  });
});

// @desc    Assign faculty to course
// @route   POST /api/v1/courses/:id/assign
// @access  Private/Admin
exports.assignFaculty = asyncHandler(async (req, res, next) => {
  const { facultyId } = req.body;
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(
      new ErrorResponse(`Course not found with id of ${req.params.id}`, 404)
    );
  }

  course.faculty = facultyId;
  await course.save();

  res.status(200).json({
    success: true,
    data: course,
  });
});