// src/api/professor.js
import api from './axios.js';

export const getTeachers = (params) => api.get('/teachers', { params });
export const addTeacher = (teacherData) => api.post('/teachers', teacherData);
export const updateTeacher = (id, teacherData) => api.put(`/teachers/${id}`, teacherData);
export const deleteTeacher = (id) => api.delete(`/teachers/${id}`);
export const getTeacherDashboardData = () => api.get('/dashboards/teacher');