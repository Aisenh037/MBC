// src/features/admin/dashboard/admin/BranchDetail.jsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button, Divider, CircularProgress } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useBranchDetail } from '../../../hooks/useBranches'; // A new, specific hook
import ErrorMessage from '../../../components/UI/ErrorMessage';

const BranchHeader = ({ branch }) => (/* ... unchanged ... */);

export default function BranchDetail() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const { data: branch, isLoading, isError, error } = useBranchDetail(branchId);

  if (isLoading) {
    return <CircularProgress />;
  }
  if (isError) {
    return <ErrorMessage message={error.message} />;
  }
  if (!branch) {
    return <Typography>Branch not found.</Typography>;
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin/branches/manage')}>
        Back to Branches
      </Button>
      <Box sx={{ mt: 2, p: 2 }}>
        <BranchHeader branch={branch} />
      </Box>
      <Divider />
      {/* Your Tabs and TabPanels for Students, Semesters, etc. would go here */}
    </Paper>
  );
}