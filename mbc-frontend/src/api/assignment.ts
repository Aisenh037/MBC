// src/api/assignment.ts
import api from './axios';
import type { 
  AssignmentResponse, 
  CreateAssignmentRequest, 
  UpdateAssignmentRequest,
  ApiResponse,
  SearchFilters
} from '../types/api';

export const getAssignments = (params?: SearchFilters): Promise<{ data: ApiResponse<AssignmentResponse[]> }> => 
  api.get('/assignments', { params });

export const createAssignment = (data: CreateAssignmentRequest): Promise<{ data: ApiResponse<AssignmentResponse> }> => 
  api.post('/assignments', data);

export const updateAssignment = (id: string, data: UpdateAssignmentRequest): Promise<{ data: ApiResponse<AssignmentResponse> }> => 
  api.put(`/assignments/${id}`, data);

export const deleteAssignment = (id: string): Promise<{ data: ApiResponse<void> }> => 
  api.delete(`/assignments/${id}`);

export const submitAssignment = (assignmentId: string, formData: FormData): Promise<{ data: ApiResponse<any> }> => {
  return api.post(`/assignments/${assignmentId}/submit`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};