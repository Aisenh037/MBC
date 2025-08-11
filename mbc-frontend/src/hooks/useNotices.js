// src/hooks/useNotices.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice,
} from '../api/notice';

export const useNotices = () => {
  return useQuery({
    queryKey: ['notices'],
    queryFn: getNotices,
    select: (data) => data.data.data || [],
  });
};

export const useCreateNotice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createNotice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
    },
  });
};

export const useUpdateNotice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateNotice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
    },
  });
};

export const useDeleteNotice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteNotice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
    },
  });
};