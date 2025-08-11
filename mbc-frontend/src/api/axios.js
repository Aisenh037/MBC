// src/api/axios.js
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const api = axios.create({
  // ✨ FIX: Use a relative path. This allows the Vite proxy to work correctly.
  baseURL: '/api/v1',
  withCredentials: true,
});

// This 'interceptor' adds the auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// This 'interceptor' handles automatic logout on token errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/'; // Redirect to login page
    }
    return Promise.reject(error);
  }
);

export default api;