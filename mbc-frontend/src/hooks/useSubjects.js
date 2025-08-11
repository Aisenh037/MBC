// src/hooks/useSubjects.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from '../api/subjects'; // ✨ Corrected path to use 'api' folder

// Hook to get all subjects
export const useSubjects = () => {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: getSubjects,
    select: (data) => data.data.data || [],
  });
};

// Hook to create a new subject
export const useCreateSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
};

// Hook to update a subject
export const useUpdateSubject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => updateSubject(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
        },
    });
};

// Hook to delete a subject
export const useDeleteSubject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteSubject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
        },
    });
};