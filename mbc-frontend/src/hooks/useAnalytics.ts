import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { getAnalyticsData } from '../api/analytics';
import type { AnalyticsData, ApiResponse } from '../types/api';

export const useAnalytics = (): UseQueryResult<AnalyticsData, Error> => {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: getAnalyticsData, // No params needed
    select: (response: ApiResponse<AnalyticsData>) => response?.data ?? {} as AnalyticsData,
    staleTime: 5 * 60 * 1000,
    retry: 0,
    refetchOnWindowFocus: false,
  });
};