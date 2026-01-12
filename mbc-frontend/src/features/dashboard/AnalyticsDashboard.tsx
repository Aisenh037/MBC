import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import StatCardGrid from './StatCardGrid';
import AnalyticsCharts from './AnalyticsCharts';
import ErrorMessage from '../../components/UI/ErrorMessage';
import { useAnalytics } from '../../hooks/useAnalytics';

export default function AnalyticsDashboard() {
    // Fetch data once using the central hook
    const { data: stats, isLoading, isError, error } = useAnalytics();

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (isError) {
        return <ErrorMessage title="Failed to Load Analytics" message={error?.message || 'An unknown error occurred'} />;
    }

    if (!stats) {
        return <ErrorMessage title="No Data" message="No analytics data available at this time." />;
    }

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                Analytics Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                An overview of key metrics and trends across the department.
            </Typography>

            {/* Reusable component for the top stat cards */}
            <StatCardGrid stats={stats} />

            {/* Reusable component for the charts */}
            <AnalyticsCharts stats={stats} />
        </Box>
    );
}
