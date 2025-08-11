// src/hooks/useStudents.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStudents, addStudent, updateStudent, deleteStudent } from '../api/student';

// Hook for admins/teachers to get all students
export const useAdminStudents = () => {
  return useQuery({
    queryKey: ['admin-students'],
    queryFn: getStudents,
    select: (data) => data.data.data || [],
  });
};

// Hook to create a new student
export const useAddStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
    },
  });
};

// Hook to update a student
export const useUpdateStudent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => updateStudent(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-students'] });
        },
    });
};

// Hook to delete a student
export const useDeleteStudent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteStudent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-students'] });
        },
    });
};