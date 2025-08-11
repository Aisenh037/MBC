// src/api/assignment.js
import api from './axios.js';

export const getAssignments = (params) => api.get('/assignments', { params });
export const createAssignment = (data) => api.post('/assignments', data);
export const updateAssignment = (id, data) => api.put(`/assignments/${id}`, data);
export const deleteAssignment = (id) => api.delete(`/assignments/${id}`);

export const submitAssignment = (assignmentId, formData) => {
  return api.post(`/assignments/${assignmentId}/submit`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};