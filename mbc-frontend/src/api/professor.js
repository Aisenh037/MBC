// src/api/professor.js
import apiClient from '../services/apiClient';

export const getTeachers = (params) => apiClient.get('/teachers', { params });
export const addTeacher = (teacherData) => apiClient.post('/teachers', teacherData);
export const updateTeacher = (id, teacherData) => apiClient.put(`/teachers/${id}`, teacherData);
export const deleteTeacher = (id) => apiClient.delete(`/teachers/${id}`);
export const getTeacherDashboardData = () => apiClient.get('/dashboards/teacher');
