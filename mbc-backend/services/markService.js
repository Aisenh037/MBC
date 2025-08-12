// services/markService.js
import Mark from '../models/Marks.js';
import Course from '../models/Course.js';
import Student from '../models/student.js';
import Professor from '../models/professor.js';
import ErrorResponse from '../utils/errorResponse.js';

export const addMarkForStudent = async (markData, userId) => {
  const professor = await Professor.findOne({ user: userId });
  if (!professor) {
    throw new ErrorResponse('Professor profile not found.', 404);
  }

  const course = await Course.findOne({ subjects: markData.subject });
  if (!course) {
      throw new ErrorResponse('Subject not found within a course.', 404);
  }

  // Authorization: Check if the professor teaches this course
  if (course.createdBy.toString() !== professor._id.toString()) {
    throw new ErrorResponse('You are not authorized to add marks for this subject.', 403);
  }
  
  markData.professor = professor._id;
  return Mark.create(markData);
};