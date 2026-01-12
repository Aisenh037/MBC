// src/hooks/useNotices.ts
import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import {
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice,
} from '../api/notice';
import type { 
  NoticeResponse, 
  CreateNoticeRequest, 
  UpdateNoticeRequest,
  ApiResponse
} from '../types/api';

interface UpdateNoticeParams {
  id: string;
  data: UpdateNoticeRequest;
}

export const useNotices = (): UseQueryResult<NoticeResponse[], Error> => {
  return useQuery({
    queryKey: ['notices'],
    queryFn: () => getNotices(),
    select: (data: { data: ApiResponse<NoticeResponse[]> }) => data.data.data || [],
  });
};

export const useCreateNotice = (): UseMutationResult<{ data: ApiResponse<NoticeResponse> }, Error, CreateNoticeRequest> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createNotice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
    },
  });
};

export const useUpdateNotice = (): UseMutationResult<{ data: ApiResponse<NoticeResponse> }, Error, UpdateNoticeParams> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: UpdateNoticeParams) => updateNotice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
    },
  });
};

export const useDeleteNotice = (): UseMutationResult<{ data: ApiResponse<void> }, Error, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteNotice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
    },
  });
};