// src/api/attendance.ts
import api from './axios';
import type { 
  AttendanceResponse, 
  CreateAttendanceRequest,
  ApiResponse,
  SearchFilters
} from '../types/api';

export const getAttendanceRecords = (params?: SearchFilters): Promise<{ data: ApiResponse<AttendanceResponse[]> }> => 
  api.get('/attendance', { params });

export const markAttendance = (attendanceData: CreateAttendanceRequest): Promise<{ data: ApiResponse<AttendanceResponse> }> => 
  api.post('/attendance', attendanceData);