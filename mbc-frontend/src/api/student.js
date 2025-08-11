// src/api/student.js
import api from './axios.js';

export const getStudents = (params) => api.get('/students', { params });
export const addStudent = (studentData) => api.post('/students', studentData);
export const updateStudent = (id, studentData) => api.put(`/students/${id}`, studentData);
export const deleteStudent = (id) => api.delete(`/students/${id}`);
export const getStudentDashboardData = () => api.get('/dashboards/student');