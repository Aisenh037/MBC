// // src/api/student.js
// import api from './axios.js';

// export const getStudents = (params) => api.get('/students', { params });
// export const addStudent = (studentData) => api.post('/students', studentData);
// export const updateStudent = (id, studentData) => api.put(`/students/${id}`, studentData);
// export const deleteStudent = (id) => api.delete(`/students/${id}`);
// export const getStudentDashboardData = () => api.get('/dashboards/student');



// src/api/student.js
import api from '../services/apiClient';

// Core CRUD
export const getStudents = (params) => api.get('/students', { params });
export const addStudent = (studentData) => api.post('/students', studentData);
export const updateStudent = (id, studentData) => api.put(`/students/${id}`, studentData);
export const deleteStudent = (id) => api.delete(`/students/${id}`);

// Extra student dashboard data
export const getStudentDashboardData = () => api.get('/dashboards/student');

// Send password reset link to a student by ID
export const sendResetLink = (id) => api.post(`/students/${id}/send-reset-link`);

// Bulk import students from a CSV file
export const bulkImportStudents = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/students/bulk-import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// Bulk export students to CSV (download)
export const bulkExportStudents = () =>
  api.get('/students/bulk-export', {
    responseType: 'blob', // important to handle file download
  }).then((response) => {
    // Create a downloadable link from blob response
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'students_export.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  });
