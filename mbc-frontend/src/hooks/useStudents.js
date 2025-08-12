import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getStudents,
  addStudent,
  updateStudent,
  deleteStudent,
  sendResetLink,
  bulkImportStudents,
  bulkExportStudents,
} from '../api/student';

const STUDENT_QUERY_KEY = 'adminStudents';

// Hook for admins/teachers to get all students
export const useAdminStudents = () => {
  return useQuery({
    queryKey: [STUDENT_QUERY_KEY],
    queryFn: getStudents,
    // --- THIS IS THE IMPROVEMENT ---
    // The 'response' object from axios has a 'data' property which is the body.
    // The body from our backend also has a 'data' property which holds the array.
    // This makes the path clear: response.data.data
    select: (response) => response.data.data || [],
  });
};

// Hook to create a new student
export const useAddStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addStudent,
    onSuccess: () => {
      // This correctly tells React Query to refetch the student list
      queryClient.invalidateQueries({ queryKey: [STUDENT_QUERY_KEY] });
    },
  });
};

// --- (The rest of your hooks are correct and do not need changes) ---

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateStudent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STUDENT_QUERY_KEY] });
    },
  });
};

export const useDeleteStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STUDENT_QUERY_KEY] });
    },
  });
};

export const useSendResetLink = () => {
    return useMutation({ mutationFn: (userId) => sendResetLink(userId) });
};

export const useBulkImportStudents = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (file) => bulkImportStudents(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [STUDENT_QUERY_KEY] });
        }
    });
};

export const useBulkExportStudents = () => {
    return useMutation({ mutationFn: () => bulkExportStudents() });
};