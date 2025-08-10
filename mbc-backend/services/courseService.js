// services/courseService.js
import Course from '../models/Course.js';
import User from '../models/user.js';
import ErrorResponse from '../utils/errorResponse.js';

/**
 * Creates a new course.
 * @param {object} courseData - Data for the new course.
 * @returns {Promise<Course>}
 */
export const createCourse = async (courseData) => {
  return Course.create(courseData);
};

/**
 * Finds a course by ID and populates its student data.
 * @param {string} courseId - The course ID.
 * @returns {Promise<Course>}
 */
export const getCourseWithStudents = async (courseId) => {
  const course = await Course.findById(courseId).populate('students', 'name email');
  if (!course) {
    throw new ErrorResponse(`Course not found with id of ${courseId}`, 404);
  }
  return course;
};

/**
 * Enrolls a student in a course.
 * @param {string} courseId - The course ID.
 * @param {string} studentId - The student's user ID.
 * @returns {Promise<Course>}
 */
export const enrollStudentInCourse = async (courseId, studentId) => {
  const course = await Course.findById(courseId);
  if (!course) {
    throw new ErrorResponse(`Course not found with id of ${courseId}`, 404);
  }
  
  if (course.students.includes(studentId)) {
    throw new ErrorResponse('Student already enrolled in this course', 400);
  }

  course.students.push(studentId);
  await course.save();
  return course;
};

/**
 * Assigns a faculty member to a course.
 * @param {string} courseId - The course ID.
 * @param {string} facultyId - The faculty's user ID.
 * @returns {Promise<Course>}
 */
export const assignFacultyToCourse = async (courseId, facultyId) => {
  const course = await Course.findById(courseId);
  if (!course) {
    throw new ErrorResponse(`Course not found with id of ${courseId}`, 404);
  }
  
  const faculty = await User.findOne({ _id: facultyId, role: 'teacher' });
  if (!faculty) {
      throw new ErrorResponse(`Faculty member not found with id ${facultyId}`, 404);
  }

  course.faculty = facultyId;
  await course.save();
  return course;
};