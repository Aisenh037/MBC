// src/services/branch.js
import api from './axios';

/**
 * Fetches all academic branches.
 * @returns {Promise<object>}
 */
export const getBranches = () => api.get('/branches');

/**
 * Fetches details for a single branch.
 * @param {string} id - The ID of the branch.
 * @returns {Promise<object>}
 */
export const getBranchById = (id) => api.get(`/branches/${id}`);

/**
 * Creates a new branch.
 * @param {object} branchData - The data for the new branch.
 * @returns {Promise<object>}
 */
export const createBranch = (branchData) => api.post('/branches', branchData);

/**
 * Updates an existing branch by its ID.
 * @param {string} id - The ID of the branch to update.
 * @param {object} branchData - The updated branch data.
 * @returns {Promise<object>}
 */
export const updateBranch = (id, branchData) => api.put(`/branches/${id}`, branchData);

/**
 * Deletes a branch by its ID.
 * @param {string} id - The ID of the branch to delete.
 * @returns {Promise<object>}
 */
export const deleteBranch = (id) => api.delete(`/branches/${id}`);

/**
 * Fetches all students belonging to a specific branch.
 * @param {string} id - The ID of the branch.
 * @returns {Promise<object>}
 */
export const getBranchStudents = (id) => api.get(`/branches/${id}/students`);