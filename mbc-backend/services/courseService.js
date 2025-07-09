import Course from '../models/Course.js';

export const getCourseWithStudents = async (courseId) => {
  return await Course.findById(courseId).populate('students', 'name email department');
};

export const getCoursesByFaculty = async (facultyId) => {
  return await Course.find({ faculty: facultyId }).populate('students', 'name email');
};

export const getDepartmentCourses = async (department) => {
  return await Course.find({ department }).populate('faculty', 'name email');
};

export const getStudentCourses = async (studentId) => {
  return await Course.find({ students: studentId }).populate('faculty', 'name email');
};
