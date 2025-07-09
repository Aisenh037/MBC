import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const host = import.meta.env.VITE_API_HOST || 'http://localhost';
const port = import.meta.env.VITE_API_PORT || '5000';

// ✅ Axios instance with CORS credentials enabled
const api = axios.create({
  baseURL: `${host}:${port}/api`,
  withCredentials: true, // 🔥 Crucial for cross-origin auth (cookies/tokens)
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Attach token to Authorization header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto logout on 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;
