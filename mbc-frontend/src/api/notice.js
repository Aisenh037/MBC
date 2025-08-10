// src/services/notice.js
import api from './axiosInstance';

/**
 * Fetches a list of notices, with optional filtering.
 * @param {object} params - Optional query params (e.g., { target: 'students' }).
 * @returns {Promise<object>}
 */
export const getNotices = (params) => api.get('/notices', { params });

/**
 * Creates a new notice.
 * @param {object} noticeData - { title, content, target, class? }.
 * @returns {Promise<object>}
 */
export const createNotice = (noticeData) => api.post('/notices', noticeData);

/**
 * Updates an existing notice by its ID.
 * @param {string} id - The ID of the notice to update.
 * @param {object} noticeData - The updated notice data.
 * @returns {Promise<object>}
 */
export const updateNotice = (id, noticeData) => api.put(`/notices/${id}`, noticeData);

/**
 * Deletes a notice by its ID.
 * @param {string} id - The ID of the notice to delete.
 * @returns {Promise<object>}
 */
export const deleteNotice = (id) => api.delete(`/notices/${id}`);