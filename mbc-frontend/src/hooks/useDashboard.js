// src/hooks/useDashboards.js
import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/apiClient';

const fetchStudentDashboardData = async (studentId = 'me') => {
  const { data } = await apiClient.get(`/dashboards/student/${studentId}`);
  return data?.data;
};

const fetchProfessorDashboardData = async (professorId = 'me') => {
  const { data } = await apiClient.get(`/dashboards/professor/${professorId}`);
  return data?.data;
};

export const useStudentDashboard = (studentId) => {
  return useQuery({
    queryKey: ['studentDashboard', studentId || 'me'],
    queryFn: () => fetchStudentDashboardData(studentId),
  });
};

export const useProfessorDashboard = (professorId) => {
  return useQuery({
    queryKey: ['professorDashboard', professorId || 'me'],
    queryFn: () => fetchProfessorDashboardData(professorId),
  });
};
