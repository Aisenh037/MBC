// services/courseService.js
import Course from '../models/Course.js';
import Professor from '../models/professor.js';
import ErrorResponse from '../utils/errorResponse.js';

/**
 * Creates a new course and links it to the creating professor.
 * @param {object} courseData - Data for the new course.
 * @param {string} userId - The user ID of the professor creating the course.
 * @returns {Promise<Course>}
 */
export const createNewCourse = async (courseData, userId) => {
  const professor = await Professor.findOne({ user: userId });
  if (!professor) {
    throw new ErrorResponse('Only professors can create courses.', 403);
  }

  // Ensure the professor is assigned to the branch they are creating a course for
  if (!professor.branches.includes(courseData.branch)) {
      throw new ErrorResponse('You are not authorized to create a course for this branch.', 403);
  }

  courseData.createdBy = professor._id;
  const course = await Course.create(courseData);
  return course;
};

/**
 * Updates an existing course after verifying ownership.
 * @param {string} courseId - The ID of the course to update.
 * @param {object} updateData - The data to update.
 * @param {object} user - The currently authenticated user.
 * @returns {Promise<Course>}
 */
export const updateCourseById = async (courseId, updateData, user) => {
  const course = await Course.findById(courseId).populate('createdBy');
  if (!course) {
    throw new ErrorResponse(`Course not found with id ${courseId}`, 404);
  }

  // Authorization check: Must be admin or the professor who created the course
  if (course.createdBy.user.toString() !== user.id && user.role !== 'admin') {
    throw new ErrorResponse('You are not authorized to update this course.', 403);
  }

  return Course.findByIdAndUpdate(courseId, updateData, { new: true, runValidators: true });
};

/**
 * Deletes a course after verifying ownership.
 * @param {string} courseId - The ID of the course to delete.
 * @param {object} user - The currently authenticated user.
 */
export const deleteCourseById = async (courseId, user) => {
    const course = await Course.findById(courseId).populate('createdBy');
    if (!course) {
        throw new ErrorResponse(`Course not found with id ${courseId}`, 404);
    }

    // Authorization check: Must be admin or the professor who created the course
    if (course.createdBy.user.toString() !== user.id && user.role !== 'admin') {
        throw new ErrorResponse('You are not authorized to delete this course.', 403);
    }
    
    // In a real-world scenario, you might check if students are enrolled before deleting.
    await course.remove();
};