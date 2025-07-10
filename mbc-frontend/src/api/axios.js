import axios from 'axios'
import api from '../utils/api'; // Adjust the path as needed
import { useAuthStore } from '../stores/authStore'

// ✅ Use the correct base URL from `.env`
// Should be like: VITE_API_URL=https://mbc-dept-management.onrender.com/api/v1
const baseURL = import.meta.env.VITE_API_URL + '/api/v1';

// ✅ Axios instance with CORS credentials enabled
const api = axios.create({
  baseURL, // 🔥 Uses the proper backend URL
  withCredentials: true, // Crucial for cross-origin auth
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
