// src/services/axios.js
import axios from 'axios';
import { useAuthStore } from '../stores/authStore'; // Assuming a Zustand store for auth

// Your VITE_API_URL should point to your backend server
// e.g., VITE_API_URL=http://localhost:5000
const baseURL = `${import.meta.env.VITE_API_URL}/api/v1`;

const api = axios.create({
  baseURL,
  withCredentials: true, // Important for sending cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the JWT token to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token; // Get token from your state manager
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 Unauthorized errors (e.g., expired token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Automatically log the user out if the token is invalid
      useAuthStore.getState().logout();
      window.location.href = '/login'; // Redirect to login page
    }
    return Promise.reject(error);
  }
);

export default api;