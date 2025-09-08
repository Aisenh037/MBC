import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} from '../api/course';

const COURSE_QUERY_KEY = 'courses';

export const useCourses = (params = {}) => {
  return useQuery({
    queryKey: [COURSE_QUERY_KEY, params],
    queryFn: () => getCourses(params),
    select: (response) => response?.data?.data ?? [],
    staleTime: 5 * 60 * 1000,
    retry: 0,
    refetchOnWindowFocus: false,
    onError: (error) => {
      console.error('Failed to fetch courses:', error);
    },
  });
};

export const useCourse = (id) => {
  return useQuery({
    queryKey: [COURSE_QUERY_KEY, id],
    queryFn: () => getCourseById(id),
    select: (response) => response?.data?.data,
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 0,
    refetchOnWindowFocus: false,
    onError: (error) => {
      console.error('Failed to fetch course:', error);
    },
  });
};

export const useAddCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCourse,
    onSuccess: () => queryClient.invalidateQueries([COURSE_QUERY_KEY]),
    onError: (error) => {
      console.error('Failed to add course:', error);
    },
  });
};

export const useUpdateCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateCourse(id, data),
    onSuccess: () => queryClient.invalidateQueries([COURSE_QUERY_KEY]),
    onError: (error) => {
      console.error('Failed to update course:', error);
    },
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteCourse(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries([COURSE_QUERY_KEY]);
      const previousCourses = queryClient.getQueryData([COURSE_QUERY_KEY]);
      queryClient.setQueryData([COURSE_QUERY_KEY], (old) =>
        old ? old.filter((course) => course._id !== id) : []
      );
      return { previousCourses };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData([COURSE_QUERY_KEY], context.previousCourses);
      console.error('Failed to delete course:', err);
    },
    onSettled: () => {
      queryClient.invalidateQueries([COURSE_QUERY_KEY]);
    },
  });
};
