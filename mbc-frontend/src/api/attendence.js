// src/api/attendance.js
import api from './axios.js';

export const getAttendanceRecords = (params) => api.get('/attendance', { params });
export const markAttendance = (attendanceData) => api.post('/attendance', attendanceData);