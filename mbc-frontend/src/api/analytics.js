// src/api/analytics.js
import api from './axiosInstance';

/**
 * Fetches the main analytics data for the admin dashboard.
 * @returns {Promise<object>}
 */
export const getAnalyticsData = () => api.get('/analytics');