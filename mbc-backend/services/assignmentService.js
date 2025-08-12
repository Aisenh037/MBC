// services/assignmentService.js
import Assignment from '../models/Assignment.js';
import Course from '../models/Course.js';
import Professor from '../models/professor.js';
import ErrorResponse from '../utils/errorResponse.js';

export const createAssignmentForCourse = async (assignmentData, userId) => {
  const professor = await Professor.findOne({ user: userId });
  if (!professor) {
    throw new ErrorResponse('Professor profile not found for the current user.', 404);
  }

  const course = await Course.findById(assignmentData.course);
  if (!course) {
    throw new ErrorResponse('Course not found.', 404);
  }

  // Authorization: Ensure the professor is the one who created the course
  if (course.createdBy.toString() !== professor._id.toString()) {
    throw new ErrorResponse('You are not authorized to create an assignment for this course.', 403);
  }

  assignmentData.professor = professor._id;
  const assignment = await Assignment.create(assignmentData);
  
  // Here you could trigger a notification service to email students
  // notifyStudentsOfNewAssignment(assignment);
  
  return assignment;
};