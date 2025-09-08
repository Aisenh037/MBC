import api from '../services/apiClient';

export const getAnalyticsData = async () => {
  try {
    const response = await api.get('/analytics');
    return response.data;
  } catch (error) {
    console.error('Error fetching analytics:', {
      status: error.status || 'N/A',
      message: error.message || 'Unknown error',
      data: error.data || null,
    });
    throw error;
  }
};