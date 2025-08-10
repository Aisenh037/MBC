// src/services/attendance.js
import api from './axios';

export const getAttendanceRecords = (params) => api.get('/attendance', { params });
export const markAttendance = (attendanceData) => api.post('/attendance', attendanceData);