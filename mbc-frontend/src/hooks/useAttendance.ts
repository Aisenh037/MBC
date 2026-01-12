import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { getAttendanceRecords, markAttendance } from '../api/attendance';
import type {
    AttendanceResponse,
    CreateAttendanceRequest,
    ApiResponse,
    SearchFilters
} from '../types/api';

export const useAttendance = (params?: SearchFilters): UseQueryResult<AttendanceResponse[], Error> => {
    return useQuery({
        queryKey: ['attendance', params],
        queryFn: () => getAttendanceRecords(params),
        select: (data: { data: ApiResponse<AttendanceResponse[]> }) => data.data.data || [],
    });
};

export const useMarkAttendance = (): UseMutationResult<{ data: ApiResponse<AttendanceResponse> }, Error, CreateAttendanceRequest> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: markAttendance,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
        },
    });
};
