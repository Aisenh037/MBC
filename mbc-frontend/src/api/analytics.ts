import api from '../services/apiClient';
import type { AnalyticsData, ApiResponse } from '../types/api';

export const getAnalyticsData = async (): Promise<ApiResponse<AnalyticsData>> => {
  try {
    const response = await api.get('/analytics');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching analytics:', {
      status: error.status || 'N/A',
      message: error.message || 'Unknown error',
      data: error.data || null,
    });
    throw error;
  }
};