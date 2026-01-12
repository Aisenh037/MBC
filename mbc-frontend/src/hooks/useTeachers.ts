// src/hooks/useTeachers.ts
import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { getTeachers, addTeacher, updateTeacher, deleteTeacher } from '../api/professor';
import type { 
  ProfessorResponse, 
  CreateProfessorRequest, 
  UpdateProfessorRequest,
  ApiResponse
} from '../types/api';

interface UpdateTeacherParams {
  id: string;
  data: UpdateProfessorRequest;
}

// Hook for admins to get all teachers
export const useAdminTeachers = (): UseQueryResult<ProfessorResponse[], Error> => {
  return useQuery({
    queryKey: ['admin-teachers'],
    queryFn: () => getTeachers(),
    select: (data: { data: ApiResponse<ProfessorResponse[]> }) => data.data.data || [],
  });
};

// Hook to create a new teacher
export const useAddTeacher = (): UseMutationResult<{ data: ApiResponse<ProfessorResponse> }, Error, CreateProfessorRequest> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teachers'] });
    },
  });
};

// Hook to update a teacher
export const useUpdateTeacher = (): UseMutationResult<{ data: ApiResponse<ProfessorResponse> }, Error, UpdateTeacherParams> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: UpdateTeacherParams) => updateTeacher(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-teachers'] });
        },
    });
};

// Hook to delete a teacher
export const useDeleteTeacher = (): UseMutationResult<{ data: ApiResponse<void> }, Error, string> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteTeacher,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-teachers'] });
        },
    });
};