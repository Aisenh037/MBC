// src/hooks/useBranches.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
} from '../api/branch'; // Using your 'api' folder

// Hook to get all branches for the admin management table
export const useAdminBranches = () => {
  return useQuery({
    queryKey: ['admin-branches'],
    queryFn: getBranches,
    select: (data) => data.data.data || [],
  });
};

// Hook to get the details of a single branch
export const useBranchDetail = (branchId) => {
  return useQuery({
    queryKey: ['branch', branchId],
    queryFn: () => getBranchById(branchId),
    select: (data) => data.data.data,
    enabled: !!branchId, // Only runs if branchId is provided
  });
};

// Hook to create a new branch
export const useCreateBranch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-branches'] });
    },
  });
};

// Hook to update a branch
export const useUpdateBranch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateBranch(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-branches'] });
      queryClient.invalidateQueries({ queryKey: ['branch', variables.id] });
    },
  });
};

// Hook to delete a branch
export const useDeleteBranch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-branches'] });
    },
  });
};