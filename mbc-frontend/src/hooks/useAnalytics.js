// src/hooks/useAnalytics.js
import { useQuery } from '@tanstack/react-query';
import { getAnalyticsData } from '../api/analytics';

export const useAnalytics = () => {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: getAnalyticsData,
    select: (data) => data.data.data,
    staleTime: 5 * 60 * 1000, // Cache this data for 5 minutes
  });
};