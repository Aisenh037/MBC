// src/services/auth.js
import api from './axiosInstance';

/**
 * Logs in a user.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} The user data and token.
 */
export const login = async (credentials) => {
  const { data } = await api.post('/auth/login', credentials);
  return data;
};

/**
 * Registers a new user.
 * @param {object} userData - { name, email, password, role, scholarNo?, employeeId? }
 * @returns {Promise<object>}
 */
export const register = async (userData) => {
  const { data } = await api.post('/auth/register', userData);
  return data;
};

/**
 * Fetches the currently logged-in user's profile.
 * @returns {Promise<object>} The user's data.
 */
export const getProfile = async () => {
    const { data } = await api.get('/users/me'); 
    return data;
};