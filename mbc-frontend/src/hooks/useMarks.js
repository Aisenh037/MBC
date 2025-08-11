// src/hooks/useMarks.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMarks,
  addMark,
  updateMark,
  deleteMark,
} from '../api/marks';

export const useMarks = (params) => {
  return useQuery({
    queryKey: ['marks', params],
    queryFn: () => getMarks(params),
    select: (data) => data.data.data,
  });
};

export const useAddMark = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addMark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marks'] });
    },
  });
};

export const useUpdateMark = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateMark(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marks'] });
    },
  });
};

export const useDeleteMark = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marks'] });
    },
  });
};