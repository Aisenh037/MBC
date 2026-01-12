import React from 'react';
import { Box, Typography, Grid, Paper, List, ListItem, ListItemText } from '@mui/material';
import { useAuthStore } from '../../../stores/authStore';
import { useNotify } from '../../../components/UI/NotificationProvider';
import { useProfessorDashboard } from '../../../hooks/useDashboard';
import StatCard from '../../../components/UI/StatCard';
import LoadingSpinner from '../../../components/UI/LoadingSpinner';

// Icons for StatCards
import SchoolIcon from '@mui/icons-material/School';
import GroupIcon from '@mui/icons-material/Group';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CampaignIcon from '@mui/icons-material/Campaign';

export default function ProfessorDashboard() {
    const { user } = useAuthStore();
    const notify = useNotify();

    const { data: dashboardData, isLoading, isError, error } = useProfessorDashboard();

    if (isLoading) {
        return <LoadingSpinner fullPage />;
    }

    if (isError) {
        notify('Could not load dashboard data', 'error');
        console.error(error);
    }

    const stats = [
        { title: 'Assigned Classes', count: dashboardData?.totalClasses || 0, icon: <SchoolIcon />, color: 'primary.main' },
        { title: 'Total Students', count: dashboardData?.totalStudents || 0, icon: <GroupIcon />, color: 'success.main' },
        { title: 'Active Assignments', count: dashboardData?.totalAssignments || 0, icon: <AssignmentIcon />, color: 'secondary.main' },
        { title: 'Pending Submissions', count: dashboardData?.pendingToGrade || 0, icon: <CampaignIcon />, color: 'warning.main' },
    ];

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Welcome, {user?.profile ? `${user.profile.firstName} ${user.profile.lastName}` : 'Professor'}!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Here's a summary of your activities and assignments.
            </Typography>

            <Grid container spacing={3}>
                {stats.map((item) => (
                    <Grid item xs={12} sm={6} md={3} key={item.title}>
                        <StatCard item={item} />
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Upcoming Deadlines</Typography>
                        <List>
                            {dashboardData?.upcomingAssignments && dashboardData.upcomingAssignments.length > 0 ? (
                                dashboardData.upcomingAssignments.map(assign => (
                                    <ListItem key={assign.id}>
                                        <ListItemText
                                            primary={assign.title}
                                            secondary={`Due: ${assign.dueDate ? new Date(assign.dueDate).toLocaleDateString() : 'No due date'}`}
                                        />
                                    </ListItem>
                                ))
                            ) : (
                                <Typography sx={{ p: 2 }} color="text.secondary">No upcoming deadlines.</Typography>
                            )}
                        </List>
                    </Paper>
                </Grid>
                {/* You could add another panel here for recent notices, etc. */}
            </Grid>
        </Box>
    );
}
