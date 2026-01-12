// src/hooks/useSubjects.ts
import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from '../api/subjects';
import type { 
  SubjectResponse, 
  CreateSubjectRequest, 
  UpdateSubjectRequest,
  ApiResponse
} from '../types/api';

interface UpdateSubjectParams {
  id: string;
  data: UpdateSubjectRequest;
}

// Hook to get all subjects
export const useSubjects = (): UseQueryResult<SubjectResponse[], Error> => {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: getSubjects,
    select: (data: { data: ApiResponse<SubjectResponse[]> }) => data.data.data || [],
  });
};

// Hook to create a new subject
export const useCreateSubject = (): UseMutationResult<{ data: ApiResponse<SubjectResponse> }, Error, CreateSubjectRequest> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
};

// Hook to update a subject
export const useUpdateSubject = (): UseMutationResult<{ data: ApiResponse<SubjectResponse> }, Error, UpdateSubjectParams> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: UpdateSubjectParams) => updateSubject(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
        },
    });
};

// Hook to delete a subject
export const useDeleteSubject = (): UseMutationResult<{ data: ApiResponse<void> }, Error, string> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteSubject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
        },
    });
};