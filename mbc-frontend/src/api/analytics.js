// src/api/analytics.js
import api from './axios.js';

export const getAnalyticsData = () => api.get('/analytics');