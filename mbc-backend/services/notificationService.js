// services/notificationService.js
import Notice from '../models/Notice.js';
import { sendEmail } from './emailService.js';
import User from '../models/user.js';
import Student from '../models/student.js';

/**
 * Creates a notice for the notice board.
 * @param {object} noticeData - Data for the new notice.
 * @param {string} createdBy - The ID of the user creating the notice.
 * @returns {Promise<Notice>}
 */
export const createNotice = async (noticeData, createdBy) => {
  noticeData.createdBy = createdBy;
  return Notice.create(noticeData);
};

/**
 * Notifies all students in a class about a new assignment.
 * @param {object} assignment - The newly created assignment object.
 */
export const notifyStudentsOfNewAssignment = async (assignment) => {
  // Find all student profiles in the specified class
  const students = await Student.find({ class: assignment.class }).populate('user', 'email name');
  
  if (students && students.length > 0) {
    const subject = `New Assignment: ${assignment.title}`;
    const message = `<p>A new assignment has been posted for your class.</p>
                     <p><b>Title:</b> ${assignment.title}</p>
                     <p><b>Due Date:</b> ${new Date(assignment.dueDate).toLocaleDateString()}</p>`;

    // Send an email to each student
    for (const student of students) {
      if (student.user) {
        await sendEmail({
          to: student.user.email,
          subject: subject,
          html: message
        });
      }
    }
  }
};