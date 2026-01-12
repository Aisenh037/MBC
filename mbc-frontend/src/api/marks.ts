// src/api/marks.ts
import api from './axios';
import type { 
  MarksResponse, 
  CreateMarksRequest, 
  UpdateMarksRequest,
  ApiResponse,
  SearchFilters
} from '../types/api';

export const getMarks = (params?: SearchFilters): Promise<{ data: ApiResponse<MarksResponse[]> }> => 
  api.get('/marks', { params });

export const addMark = (markData: CreateMarksRequest): Promise<{ data: ApiResponse<MarksResponse> }> => 
  api.post('/marks', markData);

export const updateMark = (id: string, markData: UpdateMarksRequest): Promise<{ data: ApiResponse<MarksResponse> }> => 
  api.put(`/marks/${id}`, markData);

export const deleteMark = (id: string): Promise<{ data: ApiResponse<void> }> => 
  api.delete(`/marks/${id}`);