// src/hooks/useNotices.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice,
} from '../services/notice'; // Using our central API service

// Hook to fetch all notices
export const useNotices = () => {
  return useQuery({
    queryKey: ['notices'],
    queryFn: () => getNotices(),
    select: (data) => data.data.data, // Select the array of notices from the response
  });
};

// Hook to create a new notice
export const useCreateNotice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createNotice,
    onSuccess: () => {
      // When a new notice is created, invalidate the 'notices' query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['notices'] });
    },
  });
};

// Hook to update a notice
export const useUpdateNotice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateNotice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
    },
  });
};

// Hook to delete a notice
export const useDeleteNotice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteNotice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
    },
  });
};