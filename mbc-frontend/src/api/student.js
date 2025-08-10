// src/services/student.js
import api from './axiosInstance';

/**
 * Fetches all students (for admins/teachers).
 * @param {object} params - Optional query params for pagination, filtering.
 * @returns {Promise<object>}
 */
export const getStudents = (params) => api.get('/students', { params });

/**
 * Adds a new student (admin only).
 * @param {object} studentData - The new student's details.
 * @returns {Promise<object>}
 */
export const addStudent = (studentData) => api.post('/students', studentData);

/**
 * Fetches all the necessary data for the student dashboard.
 * @returns {Promise<object>}
 */
export const getStudentDashboardData = () => api.get('/dashboards/student');