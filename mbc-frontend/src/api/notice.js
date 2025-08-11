// src/api/notice.js
import api from './axios.js';

export const getNotices = (params) => api.get('/notices', { params });
export const createNotice = (noticeData) => api.post('/notices', noticeData);
export const updateNotice = (id, noticeData) => api.put(`/notices/${id}`, noticeData);
export const deleteNotice = (id) => api.delete(`/notices/${id}`);