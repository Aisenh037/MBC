import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { useAuthStore } from '../stores/authStore';

// Type definitions for API client configuration
interface ApiError {
  status: number;
  message: string;
  data?: any;
}

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: any): any => {
    try {
      const token = useAuthStore.getState().token;
      if (token && config.headers) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (err) {
      console.debug('Token retrieval failed:', err);
    }
    return config;
  },
  (error: AxiosError): Promise<AxiosError> => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  (error: AxiosError): Promise<ApiError | Error> => {
    if (error.response?.status === 401) {
      // Prevent redirect loop
      if (!window.location.pathname.includes('/login')) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
      return Promise.reject(new Error('Unauthorized'));
    }

    // Generic error handling
    if (error.response) {
      // Server responded with non-2xx status
      return Promise.reject({
        status: error.response.status,
        message: (error.response.data as any)?.message || 'Request failed',
        data: error.response.data
      } as ApiError);
    } else if (error.request) {
      // Request was made but no response
      return Promise.reject(new Error('Network error - no response received'));
    } else {
      // Something else happened
      return Promise.reject(error);
    }
  }
);

export default apiClient;