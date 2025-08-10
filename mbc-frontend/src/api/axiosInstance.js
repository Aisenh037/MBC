// src/api/axiosInstance.js
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

// Vite exposes env vars on import.meta.env
// Provide a sane default for local dev and allow full URL in production
const apiOrigin = import.meta.env.VITE_API_URL || '';
const baseURL = `${apiOrigin}/api/v1`;

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;