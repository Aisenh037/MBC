// src/services/subjects.js
import api from './axiosInstance';

/**
 * Fetches all subjects from the database.
 * @returns {Promise<object>}
 */
export const getSubjects = () => api.get('/subjects');

/**
 * Fetches a single subject by its unique ID.
 * @param {string} id - The ID of the subject.
 * @returns {Promise<object>}
 */
export const getSubjectById = (id) => api.get(`/subjects/${id}`);

/**
 * Creates a new subject. (Admin/authorized role only)
 * @param {object} subjectData - { name, code, teachers: [id1, id2] }.
 * @returns {Promise<object>}
 */
export const createSubject = (subjectData) => api.post('/subjects', subjectData);

/**
 * Updates an existing subject by its ID. (Admin/authorized role only)
 * @param {string} id - The ID of the subject to update.
 * @param {object} subjectData - The data to update.
 * @returns {Promise<object>}
 */
export const updateSubject = (id, subjectData) => api.put(`/subjects/${id}`, subjectData);

/**
 * Deletes a subject by its ID. (Admin/authorized role only)
 * @param {string} id - The ID of the subject to delete.
 * @returns {Promise<object>}
 */
export const deleteSubject = (id) => api.delete(`/subjects/${id}`);