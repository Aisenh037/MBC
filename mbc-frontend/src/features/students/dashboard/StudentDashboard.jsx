// src/features/students/dashboard/StudentDashboard.jsx
import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper, List, ListItem, ListItemText, Divider, Chip } from '@mui/material';
import { useAuthStore } from '../../../stores/authStore';
import { useNotify } from '../../../components/UI/NotificationProvider';
import { getStudentDashboardData } from '../../../api/student';
import LoadingSpinner from '../../../components/UI/LoadingSpinner';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const notify = useNotify();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await getStudentDashboardData();
        setDashboardData(data.data);
      } catch (error) {
        notify('Could not load dashboard data', 'error');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [notify]);

  if (loading) {
    return <LoadingSpinner fullPage />;
  }

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