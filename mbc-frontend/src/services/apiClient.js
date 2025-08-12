import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const apiClient = axios.create({
  baseURL: '/api/v1',
});

// Request interceptor to automatically add the auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle global errors like 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the error is 401, token is invalid/expired, so log the user out
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      // Use window.location to force a full page reload to the login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;