// src/api/analytics.js
import apiClient from '../services/apiClient'; // Corrected import path

export const getAnalyticsData = () => apiClient.get('/analytics');