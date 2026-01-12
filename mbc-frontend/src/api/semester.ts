// src/api/semester.ts
import api from './axios';
import type { 
  SemesterResponse, 
  CreateSemesterRequest, 
  UpdateSemesterRequest,
  ApiResponse
} from '../types/api';

/**
 * Fetches all semesters for a specific branch.
 */
export const getSemestersByBranch = (branchId: string): Promise<{ data: ApiResponse<SemesterResponse[]> }> => 
  api.get(`/branches/${branchId}/semesters`);

/**
 * Creates a new semester for a branch. (Admin/authorized role only)
 */
export const createSemester = (semesterData: CreateSemesterRequest): Promise<{ data: ApiResponse<SemesterResponse> }> => 
  api.post('/semesters', semesterData);

/**
 * Updates an existing semester by its ID. (Admin/authorized role only)
 */
export const updateSemester = (id: string, semesterData: UpdateSemesterRequest): Promise<{ data: ApiResponse<SemesterResponse> }> => 
  api.put(`/semesters/${id}`, semesterData);

/**
 * Deletes a semester by its ID. (Admin/authorized role only)
 */
export const deleteSemester = (id: string): Promise<{ data: ApiResponse<void> }> => 
  api.delete(`/semesters/${id}`);