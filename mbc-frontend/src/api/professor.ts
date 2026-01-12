// src/api/professor.ts
import apiClient from '../services/apiClient';
import type {
  ProfessorResponse,
  CreateProfessorRequest,
  UpdateProfessorRequest,
  ApiResponse,
  DashboardData,
  SearchFilters
} from '../types/api';

export const getTeachers = (params?: SearchFilters): Promise<{ data: ApiResponse<ProfessorResponse[]> }> =>
  apiClient.get('/professors', { params });

export const addTeacher = (teacherData: CreateProfessorRequest): Promise<{ data: ApiResponse<ProfessorResponse> }> =>
  apiClient.post('/professors', teacherData);

export const updateTeacher = (id: string, teacherData: UpdateProfessorRequest): Promise<{ data: ApiResponse<ProfessorResponse> }> =>
  apiClient.put(`/professors/${id}`, teacherData);

export const deleteTeacher = (id: string): Promise<{ data: ApiResponse<void> }> =>
  apiClient.delete(`/professors/${id}`);

export const getTeacherDashboardData = (): Promise<{ data: ApiResponse<DashboardData> }> =>
  apiClient.get('/dashboards/teacher');
