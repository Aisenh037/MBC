// src/api/notice.ts
import api from './axios';
import type { 
  NoticeResponse, 
  CreateNoticeRequest, 
  UpdateNoticeRequest,
  ApiResponse,
  SearchFilters
} from '../types/api';

export const getNotices = (params?: SearchFilters): Promise<{ data: ApiResponse<NoticeResponse[]> }> => 
  api.get('/notices', { params });

export const createNotice = (noticeData: CreateNoticeRequest): Promise<{ data: ApiResponse<NoticeResponse> }> => 
  api.post('/notices', noticeData);

export const updateNotice = (id: string, noticeData: UpdateNoticeRequest): Promise<{ data: ApiResponse<NoticeResponse> }> => 
  api.put(`/notices/${id}`, noticeData);

export const deleteNotice = (id: string): Promise<{ data: ApiResponse<void> }> => 
  api.delete(`/notices/${id}`);