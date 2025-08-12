import { useQuery } from '@tanstack/react-query';
// Make sure this import path is correct for your project structure
import { getAnalyticsData } from '../api/analytics'; 

export const useAnalytics = () => {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: getAnalyticsData,
    // --- THIS IS THE FIX ---
    // The axios response is { data: { success, data: { ... } } }.
    // We need to select the inner 'data' object.
    select: (response) => response.data.data,
    // --- END OF FIX ---
    staleTime: 5 * 60 * 1000, // Cache this data for 5 minutes
  });
};