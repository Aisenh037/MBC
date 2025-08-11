// src/hooks/useTeachers.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTeachers, addTeacher, updateTeacher, deleteTeacher } from '../api/professor';

// Hook for admins to get all teachers
export const useAdminTeachers = () => {
  return useQuery({
    queryKey: ['admin-teachers'],
    queryFn: getTeachers,
    select: (data) => data.data.data || [],
  });
};

// Hook to create a new teacher
export const useAddTeacher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teachers'] });
    },
  });
};

// Hook to update a teacher
export const useUpdateTeacher = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => updateTeacher(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-teachers'] });
        },
    });
};

// Hook to delete a teacher
export const useDeleteTeacher = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteTeacher,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-teachers'] });
        },
    });
};