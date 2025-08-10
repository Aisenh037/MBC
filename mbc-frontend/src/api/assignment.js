// src/services/assignment.js
import api from './axiosInstance';

// --- Teacher & Admin Actions ---
export const getAssignments = (params) => api.get('/assignments', { params });
export const createAssignment = (assignmentData) => api.post('/assignments', assignmentData);
export const updateAssignment = (id, assignmentData) => api.put(`/assignments/${id}`, assignmentData);
export const deleteAssignment = (id) => api.delete(`/assignments/${id}`);

// --- Student Actions ---
/**
 * Submits a file for an assignment.
 * @param {string} assignmentId - The ID of the assignment.
 * @param {FormData} formData - The form data containing the file.
 * @returns {Promise<object>}
 */
export const submitAssignment = (assignmentId, formData) => {
  return api.post(`/assignments/${assignmentId}/submit`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }, // Important for file uploads
  });
};

// --- Teacher Actions ---
/**
 * Grades a student's submission.
 * @param {string} assignmentId
 * @param {string} submissionId
 * @param {object} gradeData - { marks, remarks }
 * @returns {Promise<object>}
 */
export const gradeSubmission = (assignmentId, submissionId, gradeData) => {
  return api.post(`/assignments/${assignmentId}/grade/${submissionId}`, gradeData);
};