import React from 'react';
import { Box, Typography, Paper, Button, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import BranchManagement from './BranchManagement';

export default function BranchDashboard() {
  const navigate = useNavigate();

  const handleAddBranch = () => {
    navigate('/admin/branches/create');
  };

  const handleViewBranches = () => {
    navigate('/admin/branches/list');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Branch Management Dashboard
      </Typography>

      <Typography variant="body1" color="text.secondary" gutterBottom>
        Manage all academic branches, view details, and perform administrative tasks.
      </Typography>

      <Grid container spacing={3} mt={2}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Add New Branch
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Register a new branch
            </Typography>
            <Box mt={2}>
              <Button variant="contained" color="primary" fullWidth onClick={handleAddBranch}>
                Add Branch
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              View All Branches
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Browse the list of all existing branches.
            </Typography>
            <Box mt={2}>
              <Button variant="outlined" color="secondary" fullWidth onClick={handleViewBranches}>
                View Branches
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
