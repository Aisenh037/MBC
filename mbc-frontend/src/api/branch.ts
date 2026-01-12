// src/api/branch.ts
import api from '../services/apiClient';
import type { 
  BranchResponse, 
  CreateBranchRequest, 
  UpdateBranchRequest,
  ApiResponse
} from '../types/api';

export const getBranches = (): Promise<{ data: ApiResponse<BranchResponse[]> }> => 
  api.get('/branches');

export const getBranchById = (id: string): Promise<{ data: ApiResponse<BranchResponse> }> => 
  api.get(`/branches/${id}`);

export const createBranch = (branchData: CreateBranchRequest): Promise<{ data: ApiResponse<BranchResponse> }> => 
  api.post('/branches', branchData);

export const updateBranch = (id: string, branchData: UpdateBranchRequest): Promise<{ data: ApiResponse<BranchResponse> }> => 
  api.put(`/branches/${id}`, branchData);

export const deleteBranch = (id: string): Promise<{ data: ApiResponse<void> }> => 
  api.delete(`/branches/${id}`);