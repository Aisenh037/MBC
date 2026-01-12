import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} from '../api/course';
import type { 
  CourseResponse, 
  CreateCourseRequest, 
  UpdateCourseRequest,
  ApiResponse,
  SearchFilters
} from '../types/api';

const COURSE_QUERY_KEY = 'courses';

interface UpdateCourseParams {
  id: string;
  data: UpdateCourseRequest;
}

export const useCourses = (params: SearchFilters = {}): UseQueryResult<CourseResponse[], Error> => {
  return useQuery({
    queryKey: [COURSE_QUERY_KEY, params],
    queryFn: () => getCourses(),
    select: (response: { data: ApiResponse<CourseResponse[]> }) => response?.data?.data ?? [],
    staleTime: 5 * 60 * 1000,
    retry: 0,
    refetchOnWindowFocus: false,
  });
};

export const useCourse = (id?: string): UseQueryResult<CourseResponse, Error> => {
  return useQuery({
    queryKey: [COURSE_QUERY_KEY, id],
    queryFn: () => getCourseById(id!),
    select: (response: { data: ApiResponse<CourseResponse> }) => response?.data?.data,
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 0,
    refetchOnWindowFocus: false,
  });
};

export const useAddCourse = (): UseMutationResult<{ data: ApiResponse<CourseResponse> }, Error, CreateCourseRequest> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCourse,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [COURSE_QUERY_KEY] }),
  });
};

export const useUpdateCourse = (): UseMutationResult<{ data: ApiResponse<CourseResponse> }, Error, UpdateCourseParams> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: UpdateCourseParams) => updateCourse(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [COURSE_QUERY_KEY] }),
  });
};

export const useDeleteCourse = (): UseMutationResult<{ data: ApiResponse<void> }, Error, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCourse(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: [COURSE_QUERY_KEY] });
      const previousCourses = queryClient.getQueryData([COURSE_QUERY_KEY]);
      queryClient.setQueryData([COURSE_QUERY_KEY], (old: CourseResponse[] | undefined) =>
        old ? old.filter((course) => course.id !== id) : []
      );
      return { previousCourses };
    },
    onError: (err: Error, _: string, context: any) => {
      queryClient.setQueryData([COURSE_QUERY_KEY], context?.previousCourses);
      console.error('Failed to delete course:', err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [COURSE_QUERY_KEY] });
    },
  });
};
