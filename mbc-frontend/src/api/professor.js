// src/services/professor.js
import api from './axiosInstance';

/**
 * Fetches all teachers (for admins).
 * @param {object} params - Optional query params.
 * @returns {Promise<object>}
 */
export const getTeachers = (params) => api.get('/teachers', { params });

/**
 * Adds a new teacher (admin only).
 * @param {object} teacherData - The new teacher's details.
 * @returns {Promise<object>}
 */
export const addTeacher = (teacherData) => api.post('/teachers', teacherData);

/**
 * Fetches all the necessary data for the teacher dashboard.
 * @returns {Promise<object>}
 */
export const getTeacherDashboardData = () => api.get('/dashboards/teacher');