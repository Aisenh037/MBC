import React from 'react';
import { Box, Typography, Grid, Paper, List, ListItem, ListItemText, Chip } from '@mui/material';
import { useAuthStore } from '../../../stores/authStore';
import { useStudentDashboard } from '../../../hooks/useDashboard';
import LoadingSpinner from '../../../components/UI/LoadingSpinner';
import ErrorMessage from '../../../components/UI/ErrorMessage';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  
  // --- THIS IS THE IMPROVEMENT ---
  // Fetch data, loading, and error states directly from our custom hook.
  // No more useState or useEffect needed here.
  const { data: dashboardData, isLoading, isError, error } = useStudentDashboard();

  if (isLoading) {
    return <LoadingSpinner fullPage />;
  }

  if (isError) {
    return <ErrorMessage message={error.message || 'Could not load dashboard data.'} />;
  }
  // --- END OF IMPROVEMENT ---

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.name}!
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        This is your central hub for assignments, marks, and notices.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Upcoming Assignments</Typography>
            <List>
              {dashboardData?.assignments?.length > 0 ? (
                dashboardData.assignments.slice(0, 5).map(assign => (
                  <ListItem key={assign._id} divider>
                    <ListItemText
                      primary={assign.title}
                      secondary={`Due: ${new Date(assign.dueDate).toLocaleDateString()}`}
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
              {dashboardData?.marks?.length > 0 ? (
                dashboardData.marks.slice(0, 5).map(mark => (
                  <ListItem key={mark._id} divider>
                    <ListItemText
                      primary={`${mark.subject?.name} - ${mark.examType}`}
                      secondary={`Remarks: ${mark.remarks || 'N/A'}`}
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
              {dashboardData?.notices?.length > 0 ? (
                dashboardData.notices.slice(0, 3).map(notice => (
                  <ListItem key={notice._id} divider>
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