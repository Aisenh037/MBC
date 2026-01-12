import React from 'react';
import { Box, Typography, Grid, Paper, List, ListItem, ListItemText, Chip } from '@mui/material';
import { useAuthStore } from '../../../stores/authStore';
import { useStudentDashboard } from '../../../hooks/useDashboard';
import LoadingSpinner from '../../../components/UI/LoadingSpinner';
import ErrorMessage from '../../../components/UI/ErrorMessage';

export default function StudentDashboard() {
    const { user } = useAuthStore();

    const { data: dashboardData, isLoading, isError, error } = useStudentDashboard();

    if (isLoading) {
        return <LoadingSpinner fullPage />;
    }

    if (isError) {
        return <ErrorMessage message={(error as Error).message || 'Could not load dashboard data.'} />;
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Welcome, {user?.profile ? `${user.profile.firstName} ${user.profile.lastName}` : 'Student'}!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                This is your central hub for assignments, marks, and notices.
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>Upcoming Assignments</Typography>
                        <List>
                            {dashboardData?.assignments && dashboardData.assignments.length > 0 ? (
                                dashboardData.assignments.slice(0, 5).map(assign => (
                                    <ListItem key={assign.id} divider>
                                        <ListItemText
                                            primary={assign.title}
                                            secondary={`Due: ${assign.dueDate ? new Date(assign.dueDate).toLocaleDateString() : 'No due date'}`}
                                        />
                                    </ListItem>
                                ))
                            ) : (
                                <Typography sx={{ p: 2 }} color="text.secondary">No upcoming assignments.</Typography>
                            )}
                        </List>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>Recent Marks</Typography>
                        <List>
                            {dashboardData?.marks && dashboardData.marks.length > 0 ? (
                                dashboardData.marks.slice(0, 5).map(mark => (
                                    <ListItem key={mark.id} divider>
                                        <ListItemText
                                            primary={`${mark.course?.name || 'Unknown Subject'} - ${mark.examType}`}
                                            secondary={`Remarks: ${mark.feedback || 'N/A'}`}
                                        />
                                        <Chip label={`${mark.marksObtained} / ${mark.maxMarks}`} color="primary" />
                                    </ListItem>
                                ))
                            ) : (
                                <Typography sx={{ p: 2 }} color="text.secondary">No recent marks found.</Typography>
                            )}
                        </List>
                    </Paper>
                </Grid>
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>Recent Notices</Typography>
                        <List>
                            {dashboardData?.notices && dashboardData.notices.length > 0 ? (
                                dashboardData.notices.slice(0, 3).map(notice => (
                                    <ListItem key={notice.id} divider>
                                        <ListItemText
                                            primary={notice.title}
                                            secondary={notice.content}
                                        />
                                    </ListItem>
                                ))
                            ) : (
                                <Typography sx={{ p: 2 }} color="text.secondary">No new notices.</Typography>
                            )}
                        </List>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
