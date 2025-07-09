import React from 'react';
import { Box, Typography, Grid, Paper, Button, AppBar, Toolbar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import BranchDashboard from './BranchDashboard';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const sections = [
    {
      title: "Manage Professors",
      description: "Add, edit, and manage professors.",
      path: "/admin/manage-professors",
    },
    {
      title: "Manage Students",
      description: "Enroll, edit, and track student records.",
      path: "/admin/manage-students",
    },
    {
      title: "Manage Branches / Classes ",
      description: "Define and update academic branches.",
      path: "/admin/manage-branches",
    },
  ];

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f7f7f7" }}>
      {/* Top AppBar */}
      <AppBar position="static">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6">MBC Portal - Admin</Typography>
          <Button color="inherit" onClick={logout}>Logout</Button>
        </Toolbar>
      </AppBar>

      {/* Dashboard Cards */}
      <Box sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Admin Dashboard
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {sections.map(({ title, description, path }, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper elevation={3} sx={{ p: 3, height: '100%', textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>{title}</Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>{description}</Typography>
                <Button variant="contained" fullWidth onClick={() => navigate(path)}>
                  Go to {title}
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}
