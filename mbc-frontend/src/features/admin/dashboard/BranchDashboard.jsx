// src/features/admin/dashboard/admin/BranchDashboard.jsx
import React from 'react';
import { Box, Typography, Paper, Button, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import ListAltIcon from '@mui/icons-material/ListAlt';

export default function BranchDashboard() {
  const navigate = useNavigate();

  // Navigation handlers are now more descriptive
  const handleNavigateToCreate = () => {
    navigate('/admin/branches/create'); // Assumes you'll have a dedicated create route/page
  };

  const handleNavigateToList = () => {
    navigate('/admin/branches/manage'); // The main management page
  };

  return (
    <Paper sx={{ p: 4, borderRadius: 2 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Branch Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Create new academic branches, view student enrollment, and manage course structures for all branches.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Create a New Branch
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ minHeight: '40px', mb: 2 }}>
              Define a new academic program, including its code, coordinator, and capacity.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleNavigateToCreate}
            >
              Add Branch
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              View & Manage Branches
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ minHeight: '40px', mb: 2 }}>
              Browse, edit, and view details for all existing academic branches.
            </Typography>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<ListAltIcon />}
              onClick={handleNavigateToList}
            >
              Manage Branches
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
}