// src/hooks/useDashboard.ts
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import apiClient from '../services/apiClient';
import type { StudentDashboardData, ProfessorDashboardData, ApiResponse } from '../types/api';

const fetchStudentDashboardData = async (studentId: string = 'me'): Promise<StudentDashboardData> => {
  const { data } = await apiClient.get<ApiResponse<StudentDashboardData>>(`/dashboards/student/${studentId}`);
  return data.data;
};

const fetchProfessorDashboardData = async (professorId: string = 'me'): Promise<ProfessorDashboardData> => {
  const { data } = await apiClient.get<ApiResponse<ProfessorDashboardData>>(`/dashboards/professor/${professorId}`);
  return data.data;
};

export const useStudentDashboard = (studentId?: string): UseQueryResult<StudentDashboardData, Error> => {
  return useQuery({
    queryKey: ['studentDashboard', studentId || 'me'],
    queryFn: () => fetchStudentDashboardData(studentId),
  });
};

export const useProfessorDashboard = (professorId?: string): UseQueryResult<ProfessorDashboardData, Error> => {
  return useQuery({
    queryKey: ['professorDashboard', professorId || 'me'],
    queryFn: () => fetchProfessorDashboardData(professorId),
  });
};
