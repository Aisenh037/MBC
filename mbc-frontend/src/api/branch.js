// src/api/branch.js
import api from './axiosInstance';

export const getBranches = () => api.get('/branches');
export const getBranchById = (id) => api.get(`/branches/${id}`);
export const createBranch = (branchData) => api.post('/branches', branchData);
export const updateBranch = (id, branchData) => api.put(`/branches/${id}`, branchData);
export const deleteBranch = (id) => api.delete(`/branches/${id}`);
export const getBranchStudents = (id) => api.get(`/branches/${id}/students`);