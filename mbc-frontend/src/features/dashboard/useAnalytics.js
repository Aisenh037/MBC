// src/hooks/useAnalytics.js
import { useQuery } from '@tanstack/react-query';
import { getAnalyticsData } from '../services/analytics'; // Using our central API service

/**
 * A custom hook to fetch and cache the main analytics dashboard data.
 */
export const useAnalytics = () => {
  return useQuery({
    queryKey: ['analytics'], // Unique key for this data
    queryFn: getAnalyticsData,
    select: (data) => data.data.data, // Select the nested data object from the API response
    staleTime: 5 * 60 * 1000, // Cache data for 5 minutes to avoid rapid refetching
  });
};