import { useQuery } from '@tanstack/react-query';
import { getAnalyticsData } from '../api/analytics';

export const useAnalytics = () => {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: getAnalyticsData, // No params needed
    select: (response) => response?.data?.data ?? {},
    staleTime: 5 * 60 * 1000,
    retry: 0,
    refetchOnWindowFocus: false,
    onError: (error) => {
      console.error('Failed to fetch analytics:', {
        status: error.status || 'N/A',
        message: error.message || 'Unknown error',
        data: error.data || null,
      });
      // Example: toast.error(`Error fetching analytics: ${error.message}`);
    },
  });
};