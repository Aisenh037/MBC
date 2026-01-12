import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import {
  getStudents,
  addStudent,
  updateStudent,
  deleteStudent,
  sendResetLink,
  bulkImportStudents,
  bulkExportStudents,
} from '../api/student';
import type { 
  StudentResponse, 
  CreateStudentRequest, 
  UpdateStudentRequest,
  ApiResponse,
  BulkImportResponse,
  SearchFilters
} from '../types/api';

const STUDENT_QUERY_KEY = 'adminStudents';

interface UpdateStudentParams {
  id: string;
  data: UpdateStudentRequest;
}

export const useAdminStudents = (params: SearchFilters = {}): UseQueryResult<StudentResponse[], Error> => {
  return useQuery({
    queryKey: [STUDENT_QUERY_KEY, params],
    queryFn: () => getStudents(params),
    select: (response: ApiResponse<StudentResponse[]>) => response?.data ?? [],
    staleTime: 5 * 60 * 1000,
    retry: 0,
    refetchOnWindowFocus: false,
  });
};

export const useAddStudent = (): UseMutationResult<ApiResponse<StudentResponse>, Error, CreateStudentRequest> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addStudent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [STUDENT_QUERY_KEY] }),
  });
};

export const useUpdateStudent = (): UseMutationResult<ApiResponse<StudentResponse>, Error, UpdateStudentParams> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: UpdateStudentParams) => updateStudent(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [STUDENT_QUERY_KEY] }),
  });
};

export const useDeleteStudent = (): UseMutationResult<ApiResponse<void>, Error, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStudent(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: [STUDENT_QUERY_KEY] });
      const previousStudents = queryClient.getQueryData([STUDENT_QUERY_KEY]);
      queryClient.setQueryData([STUDENT_QUERY_KEY], (old: StudentResponse[] | undefined) =>
        old ? old.filter((student) => student.id !== id) : []
      );
      return { previousStudents };
    },
    onError: (err: Error, _: string, context: any) => {
      queryClient.setQueryData([STUDENT_QUERY_KEY], context?.previousStudents);
      console.error('Failed to delete student:', err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [STUDENT_QUERY_KEY] });
    },
  });
};

export const useSendResetLink = (): UseMutationResult<ApiResponse<{ message: string }>, Error, string> => {
  return useMutation({
    mutationFn: (userId: string) => sendResetLink(userId),
    onError: (error: Error) => {
      console.error('Failed to send reset link:', error);
    },
  });
};

export const useBulkImportStudents = (): UseMutationResult<ApiResponse<BulkImportResponse>, Error, File> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => bulkImportStudents(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [STUDENT_QUERY_KEY] }),
  });
};

export const useBulkExportStudents = (): UseMutationResult<{ filename: string }, Error, void> => {
  return useMutation({
    mutationFn: () => bulkExportStudents(),
    onError: (error: Error) => {
      console.error('Export failed:', error);
    },
  });
};