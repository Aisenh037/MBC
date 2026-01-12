// src/hooks/useAssignments.ts
import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
} from '../api/assignment';
import type { 
  AssignmentResponse, 
  CreateAssignmentRequest, 
  UpdateAssignmentRequest,
  ApiResponse,
  SearchFilters
} from '../types/api';

interface UpdateAssignmentParams {
  id: string;
  data: UpdateAssignmentRequest;
}

interface SubmitAssignmentParams {
  assignmentId: string;
  formData: FormData;
}

export const useAssignments = (params?: SearchFilters): UseQueryResult<AssignmentResponse[], Error> => {
  return useQuery({
    queryKey: ['assignments', params],
    queryFn: () => getAssignments(params),
    select: (data: { data: ApiResponse<AssignmentResponse[]> }) => data.data.data || [],
  });
};

export const useCreateAssignment = (): UseMutationResult<{ data: ApiResponse<AssignmentResponse> }, Error, CreateAssignmentRequest> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
};

export const useUpdateAssignment = (): UseMutationResult<{ data: ApiResponse<AssignmentResponse> }, Error, UpdateAssignmentParams> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: UpdateAssignmentParams) => updateAssignment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
};

export const useDeleteAssignment = (): UseMutationResult<{ data: ApiResponse<void> }, Error, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
};

export const useSubmitAssignment = (): UseMutationResult<{ data: ApiResponse<any> }, Error, SubmitAssignmentParams> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ assignmentId, formData }: SubmitAssignmentParams) => submitAssignment(assignmentId, formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assignments'] });
            queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
        }
    });
};