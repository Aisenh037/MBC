import api from '/src/services/apiClient.js';

// CRUD operations
export const getStudents = async (params) => {
  try {
    const response = await api.get('/students', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching students:', {
      status: error.status || 'N/A',
      message: error.message || 'Unknown error',
      data: error.data || null,
    });
    throw error;
  }
};

export const addStudent = async (studentData) => {
  try {
    const response = await api.post('/students', studentData);
    return response.data;
  } catch (error) {
    console.error('Error adding student:', error);
    throw error;
  }
};

export const updateStudent = async (id, studentData) => {
  try {
    const response = await api.put(`/students/${id}`, studentData);
    return response.data;
  } catch (error) {
    console.error('Error updating student:', error);
    throw error;
  }
};

export const deleteStudent = async (id) => {
  try {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting student:', error);
    throw error;
  }
};

export const getStudentDashboardData = async (studentId = 'me') => {
  try {
    const response = await api.get(`/dashboards/student/${studentId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching student dashboard:', error);
    throw error;
  }
};

export const sendResetLink = async (id) => {
  try {
    const response = await api.post(`/students/${id}/send-reset-link`);
    return response.data;
  } catch (error) {
    console.error('Error sending reset link:', error);
    throw error;
  }
};

export const bulkImportStudents = async (file) => {
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

export const bulkExportStudents = async () => {
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