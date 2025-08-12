// utils/validationSchemas.js
import Joi from 'joi';

// ... (your existing schemas for student, etc.)

// Schema for creating a new course
export const createCourseSchema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    code: Joi.string().min(3).max(20).required(),
    branch: Joi.string().hex().length(24).required(), // MongoDB ObjectId
    semester: Joi.number().integer().min(1).max(12).required(),
});

// Schema for updating a course (all fields are optional)
export const updateCourseSchema = Joi.object({
    name: Joi.string().min(3).max(100),
    code: Joi.string().min(3).max(20),
    branch: Joi.string().hex().length(24),
    semester: Joi.number().integer().min(1).max(12),
});