// src/api/axios.js
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

// Your VITE_API_URL should point to your backend server (e.g., http://localhost:5000)
const baseURL = `${import.meta.env.VITE_API_URL || ''}/api/v1`;

const api = axios.create({
  baseURL,
  withCredentials: true, // Crucial for sending cookies if you use them
});

// This 'interceptor' runs before every request
api.interceptors.request.use(
  (config) => {
    // Get the token from your global auth store
    const token = useAuthStore.getState().token;
    if (token) {
      // Add the token to the Authorization header
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// This 'interceptor' runs when a response has an error
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the error is a 401 Unauthorized (e.g., token expired), log the user out
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/'; // Redirect to login page
    }
    return Promise.reject(error);
  }
);

export default api;