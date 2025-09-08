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

export const useAdminStudents = (params = {}) => {
  return useQuery({
    queryKey: [STUDENT_QUERY_KEY, params],
    queryFn: () => getStudents(params),
    select: (response) => response?.data?.data ?? [],
    staleTime: 5 * 60 * 1000,
    retry: 0,
    refetchOnWindowFocus: false,
    onError: (error) => {
      console.error('Failed to fetch students:', error);
      // Example: toast.error(`Error: ${error.message}`);
    },
  });
};

export const useAddStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addStudent,
    onSuccess: () => queryClient.invalidateQueries([STUDENT_QUERY_KEY]),
    onError: (error) => {
      console.error('Failed to add student:', error);
    },
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateStudent(id, data),
    onSuccess: () => queryClient.invalidateQueries([STUDENT_QUERY_KEY]),
    onError: (error) => {
      console.error('Failed to update student:', error);
    },
  });
};

export const useDeleteStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteStudent(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries([STUDENT_QUERY_KEY]);
      const previousStudents = queryClient.getQueryData([STUDENT_QUERY_KEY]);
      queryClient.setQueryData([STUDENT_QUERY_KEY], (old) =>
        old ? old.filter((student) => student._id !== id) : []
      );
      return { previousStudents };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData([STUDENT_QUERY_KEY], context.previousStudents);
      console.error('Failed to delete student:', err);
    },
    onSettled: () => {
      queryClient.invalidateQueries([STUDENT_QUERY_KEY]);
    },
  });
};

export const useSendResetLink = () => {
  return useMutation({
    mutationFn: (userId) => sendResetLink(userId),
    onError: (error) => {
      console.error('Failed to send reset link:', error);
    },
  });
};

export const useBulkImportStudents = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file) => bulkImportStudents(file),
    onSuccess: () => queryClient.invalidateQueries([STUDENT_QUERY_KEY]),
    onError: (error) => {
      console.error('Failed to import students:', error);
    },
  });
};

export const useBulkExportStudents = () => {
  return useMutation({
    mutationFn: () => bulkExportStudents(),
    onError: (error) => {
      console.error('Export failed:', error);
    },
  });
};