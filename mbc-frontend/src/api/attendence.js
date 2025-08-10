// src/api/attendence.js
import api from './axiosInstance';

export const getAttendanceRecords = (params) => api.get('/attendance', { params });
export const markAttendance = (attendanceData) => api.post('/attendance', attendanceData);