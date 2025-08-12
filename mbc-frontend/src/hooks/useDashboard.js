import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/apiClient';

// The API function now accepts an optional ID
const fetchStudentDashboardData = async (studentId = 'me') => {
    const { data } = await apiClient.get(`/dashboards/student/${studentId}`);
    return data.data;
};

const fetchProfessorDashboardData = async (professorId = 'me') => {
    const { data } = await apiClient.get(`/dashboards/professor/${professorId}`);
    return data.data;
};

/**
 * Hook to fetch dashboard data for a student.
 * Defaults to the currently logged-in student.
 * @param {string} [studentId] - Optional ID of a specific student.
 */
export const useStudentDashboard = (studentId) => {
  return useQuery({
    // The query key is now dynamic, including the ID
    queryKey: ['studentDashboard', studentId || 'me'],
    queryFn: () => fetchStudentDashboardData(studentId),
  });
};

/**
 * Hook to fetch dashboard data for a professor.
 * Defaults to the currently logged-in professor.
 * @param {string} [professorId] - Optional ID of a specific professor.
 */
export const useProfessorDashboard = (professorId) => {
    return useQuery({
      queryKey: ['professorDashboard', professorId || 'me'],
      queryFn: () => fetchProfessorDashboardData(professorId),
    });
};