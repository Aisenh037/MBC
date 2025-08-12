// controllers/courseController.js
import asyncHandler from '../middleware/asyncHandler.js';
import Course from '../models/Course.js';
import { createNewCourse, updateCourseById, deleteCourseById } from '../services/courseService.js';

// @desc    Get all courses
export const getCourses = asyncHandler(async (req, res) => {
    res.status(200).json(res.advancedResults);
});

// @desc    Get a single course
export const getCourse = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id).populate([
        { path: 'branch', select: 'name' },
        { path: 'createdBy', populate: { path: 'user', select: 'name' } }
    ]);
    if (!course) {
        return next(new ErrorResponse(`Course not found`, 404));
    }
    res.status(200).json({ success: true, data: course });
});

// @desc    Create a new course
export const createCourse = asyncHandler(async (req, res) => {
    const course = await createNewCourse(req.body, req.user.id);
    res.status(201).json({ success: true, data: course });
});

// @desc    Update a course
export const updateCourse = asyncHandler(async (req, res) => {
    const course = await updateCourseById(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, data: course });
});

// @desc    Delete a course
export const deleteCourse = asyncHandler(async (req, res) => {
    await deleteCourseById(req.params.id, req.user);
    res.status(200).json({ success: true, data: {} });
});