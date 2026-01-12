// src/hooks/useMarks.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMarks,
  addMark,
  updateMark,
  deleteMark,
} from '../services/marks'; // Using our central API service

// Hook to fetch marks with optional filters (e.g., by studentId)
export const useMarks = (params) => {
  return useQuery({
    queryKey: ['marks', params],
    queryFn: () => getMarks(params),
    select: (data) => data.data.data, // Select the array of marks from the response
  });
};

// Hook to create a new mark entry
export const useAddMark = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addMark,
    onSuccess: () => {
      // When a new mark is added, invalidate all 'marks' queries to refetch
      queryClient.invalidateQueries({ queryKey: ['marks'] });
    },
  });
};

// Hook to update a mark entry
export const useUpdateMark = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateMark(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marks'] });
    },
  });
};

// Hook to delete a mark entry
export const useDeleteMark = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marks'] });
    },
  });
};