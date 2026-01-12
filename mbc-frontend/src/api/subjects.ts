// src/api/subjects.ts
import api from './axios';
import type { 
  SubjectResponse, 
  CreateSubjectRequest, 
  UpdateSubjectRequest,
  ApiResponse
} from '../types/api';

export const getSubjects = (): Promise<{ data: ApiResponse<SubjectResponse[]> }> => 
  api.get('/subjects');

export const getSubjectById = (id: string): Promise<{ data: ApiResponse<SubjectResponse> }> => 
  api.get(`/subjects/${id}`);

export const createSubject = (subjectData: CreateSubjectRequest): Promise<{ data: ApiResponse<SubjectResponse> }> => 
  api.post('/subjects', subjectData);

export const updateSubject = (id: string, subjectData: UpdateSubjectRequest): Promise<{ data: ApiResponse<SubjectResponse> }> => 
  api.put(`/subjects/${id}`, subjectData);

export const deleteSubject = (id: string): Promise<{ data: ApiResponse<void> }> => 
  api.delete(`/subjects/${id}`);