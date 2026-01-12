// src/hooks/useMarks.ts
import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import {
  getMarks,
  addMark,
  updateMark,
  deleteMark,
} from '../api/marks';
import type { 
  MarksResponse, 
  CreateMarksRequest, 
  UpdateMarksRequest,
  ApiResponse,
  SearchFilters
} from '../types/api';

interface UpdateMarkParams {
  id: string;
  data: UpdateMarksRequest;
}

export const useMarks = (params?: SearchFilters): UseQueryResult<MarksResponse[], Error> => {
  return useQuery({
    queryKey: ['marks', params],
    queryFn: () => getMarks(params),
    select: (data: { data: ApiResponse<MarksResponse[]> }) => data.data.data,
  });
};

export const useAddMark = (): UseMutationResult<{ data: ApiResponse<MarksResponse> }, Error, CreateMarksRequest> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addMark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marks'] });
    },
  });
};

export const useUpdateMark = (): UseMutationResult<{ data: ApiResponse<MarksResponse> }, Error, UpdateMarkParams> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: UpdateMarkParams) => updateMark(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marks'] });
    },
  });
};

export const useDeleteMark = (): UseMutationResult<{ data: ApiResponse<void> }, Error, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marks'] });
    },
  });
};