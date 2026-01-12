// src/hooks/useAssignments.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
} from '../services/assignment'; // Using our central API service

// Hook to fetch all assignments with optional filters
export const useAssignments = (params) => {
  return useQuery({
    queryKey: ['assignments', params],
    queryFn: () => getAssignments(params),
  });
};

// Hook to create a new assignment
export const useCreateAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAssignment,
    onSuccess: () => {
      // When a new assignment is created, invalidate the 'assignments' query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
};

// Hook to update an assignment
export const useUpdateAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateAssignment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
};

// Hook to delete an assignment
export const useDeleteAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
};

// Hook for a student to submit an assignment
export const useSubmitAssignment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ assignmentId, formData }) => submitAssignment(assignmentId, formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assignments'] });
            queryClient.invalidateQueries({ queryKey: ['studentDashboard'] }); // Also refresh dashboard data
        }
    });
};