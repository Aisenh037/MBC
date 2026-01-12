import api from '../services/apiClient';
import type { 
  StudentResponse, 
  CreateStudentRequest, 
  UpdateStudentRequest,
  ApiResponse,
  BulkImportResponse,
  DashboardData,
  SearchFilters
} from '../types/api';

// CRUD operations
export const getStudents = async (params?: SearchFilters): Promise<ApiResponse<StudentResponse[]>> => {
  try {
    const response = await api.get('/students', { params });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching students:', {
      status: error.status || 'N/A',
      message: error.message || 'Unknown error',
      data: error.data || null,
    });
    throw error;
  }
};

export const addStudent = async (studentData: CreateStudentRequest): Promise<ApiResponse<StudentResponse>> => {
  try {
    const response = await api.post('/students', studentData);
    return response.data;
  } catch (error) {
    console.error('Error adding student:', error);
    throw error;
  }
};

export const updateStudent = async (id: string, studentData: UpdateStudentRequest): Promise<ApiResponse<StudentResponse>> => {
  try {
    const response = await api.put(`/students/${id}`, studentData);
    return response.data;
  } catch (error) {
    console.error('Error updating student:', error);
    throw error;
  }
};

export const deleteStudent = async (id: string): Promise<ApiResponse<void>> => {
  try {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting student:', error);
    throw error;
  }
};

export const getStudentDashboardData = async (studentId: string = 'me'): Promise<ApiResponse<DashboardData>> => {
  try {
    const response = await api.get(`/dashboards/student/${studentId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching student dashboard:', error);
    throw error;
  }
};

export const sendResetLink = async (id: string): Promise<ApiResponse<{ message: string }>> => {
  try {
    const response = await api.post(`/students/${id}/send-reset-link`);
    return response.data;
  } catch (error) {
    console.error('Error sending reset link:', error);
    throw error;
  }
};

export const bulkImportStudents = async (file: File): Promise<ApiResponse<BulkImportResponse>> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/students/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error('Error importing students:', error);
    throw error;
  }
};

export const bulkExportStudents = async (): Promise<{ filename: string }> => {
  try {
    const response = await api.get('/students/bulk-export', { responseType: 'blob' });
    const blob = new Blob([response.data], { type: response.headers['content-type'] || 'text/csv' });

    const disposition = response.headers['content-disposition'];
    const matches = disposition && disposition.match(/filename[^;=\\n]*=((['"]).*?\2|[^;\n]*)/);
    const filename = matches ? matches[1].replace(/['"]/g, '') : `students_export_${Date.now()}.csv`;

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { filename };
  } catch (error) {
    console.error('Error exporting students:', error);
    throw error;
  }
};