// routes/courseRoute.js
import express from 'express';
import { getCourses, getCourse, createCourse, updateCourse, deleteCourse } from '../controllers/courseController.js';

// Middleware
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import advancedResults from '../middleware/advancedResults.js';

// Models and Schemas
import Course from '../models/Course.js';
import { createCourseSchema, updateCourseSchema } from '../utils/validationSchemas.js';

const router = express.Router();

// All routes are protected and require a logged-in user
router.use(protect);

router.route('/')
    .get(advancedResults(Course, [{ path: 'branch', select: 'name' }]), getCourses)
    .post(authorize('professor'), validate(createCourseSchema), createCourse);

router.route('/:id')
    .get(getCourse)
    .put(authorize('admin', 'professor'), validate(updateCourseSchema), updateCourse)
    .delete(authorize('admin', 'professor'), deleteCourse);

export default router;