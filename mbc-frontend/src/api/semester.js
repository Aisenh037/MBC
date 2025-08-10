// src/services/semester.js
import api from './axiosInstance';

/**
 * Fetches all semesters for a specific branch.
 * @param {string} branchId - The ID of the branch.
 * @returns {Promise<object>}
 */
export const getSemestersByBranch = (branchId) => api.get(`/branches/${branchId}/semesters`);

/**
 * Creates a new semester for a branch. (Admin/authorized role only)
 * @param {object} semesterData - { number, branch }.
 * @returns {Promise<object>}
 */
export const createSemester = (semesterData) => api.post('/semesters', semesterData);

/**
 * Updates an existing semester by its ID. (Admin/authorized role only)
 * @param {string} id - The ID of the semester to update.
 * @param {object} semesterData - The data to update.
 * @returns {Promise<object>}
 */
export const updateSemester = (id, semesterData) => api.put(`/semesters/${id}`, semesterData);

/**
 * Deletes a semester by its ID. (Admin/authorized role only)
 * @param {string} id - The ID of the semester to delete.
 * @returns {Promise<object>}
 */
export const deleteSemester = (id) => api.delete(`/semesters/${id}`);