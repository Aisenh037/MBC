import api from './axios';
import type { 
  CourseResponse, 
  CreateCourseRequest, 
  UpdateCourseRequest,
  ApiResponse
} from '../types/api';

export const getCourses = (): Promise<{ data: ApiResponse<CourseResponse[]> }> => 
  api.get('/courses');

export const getCourseById = (id: string): Promise<{ data: ApiResponse<CourseResponse> }> => 
  api.get(`/courses/${id}`);

export const createCourse = (courseData: CreateCourseRequest): Promise<{ data: ApiResponse<CourseResponse> }> => 
  api.post('/courses', courseData);

export const updateCourse = (id: string, courseData: UpdateCourseRequest): Promise<{ data: ApiResponse<CourseResponse> }> => 
  api.put(`/courses/${id}`, courseData);

export const deleteCourse = (id: string): Promise<{ data: ApiResponse<void> }> => 
  api.delete(`/courses/${id}`);
