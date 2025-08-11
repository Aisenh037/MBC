// src/api/marks.js
import api from './axios.js';

export const getMarks = (params) => api.get('/marks', { params });
export const addMark = (markData) => api.post('/marks', markData);
export const updateMark = (id, markData) => api.put(`/marks/${id}`, markData);
export const deleteMark = (id) => api.delete(`/marks/${id}`);