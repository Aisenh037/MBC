// src/hooks/useBranches.ts
import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import {
  getBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
} from '../api/branch';
import type { 
  BranchResponse, 
  CreateBranchRequest, 
  UpdateBranchRequest,
  ApiResponse
} from '../types/api';

interface UpdateBranchParams {
  id: string;
  data: UpdateBranchRequest;
}

// Hook to get all branches for the admin management table
export const useAdminBranches = (): UseQueryResult<BranchResponse[], Error> => {
  return useQuery({
    queryKey: ['admin-branches'],
    queryFn: getBranches,
    select: (data: { data: ApiResponse<BranchResponse[]> }) => data.data.data || [],
  });
};

// Hook to get the details of a single branch
export const useBranchDetail = (branchId?: string): UseQueryResult<BranchResponse, Error> => {
  return useQuery({
    queryKey: ['branch', branchId],
    queryFn: () => getBranchById(branchId!),
    select: (data: { data: ApiResponse<BranchResponse> }) => data.data.data,
    enabled: !!branchId, // Only runs if branchId is provided
  });
};

// Hook to create a new branch
export const useCreateBranch = (): UseMutationResult<{ data: ApiResponse<BranchResponse> }, Error, CreateBranchRequest> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-branches'] });
    },
  });
};

// Hook to update a branch
export const useUpdateBranch = (): UseMutationResult<{ data: ApiResponse<BranchResponse> }, Error, UpdateBranchParams> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: UpdateBranchParams) => updateBranch(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-branches'] });
      queryClient.invalidateQueries({ queryKey: ['branch', variables.id] });
    },
  });
};

// Hook to delete a branch
export const useDeleteBranch = (): UseMutationResult<{ data: ApiResponse<void> }, Error, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-branches'] });
    },
  });
};