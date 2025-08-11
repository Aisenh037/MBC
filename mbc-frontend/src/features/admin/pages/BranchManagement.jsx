// src/features/admin/pages/BranchManagement.jsx
import React, { useState } from 'react';
import { Box, Typography, Button, Dialog, Stack, IconButton } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon } from "@mui/icons-material";
import { useNavigate } from 'react-router-dom';
// ✨ CORRECTED PATHS (using path aliases is even better: '@/hooks/useBranches')
import { useNotify } from '../../../components/UI/NotificationProvider';
import { useAdminBranches, useDeleteBranch } from '../../../hooks/useBranches';
import BranchForm from '../components/BranchForm.jsx'; 

export default function BranchManagement() {
  const navigate = useNavigate();
  const notify = useNotify();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);

  // Clean data fetching with our custom hook
  const { data: branches = [], isLoading } = useAdminBranches();
  const deleteMutation = useDeleteBranch();

  const handleOpenDialog = (branch = null) => {
    setEditingBranch(branch);
    setDialogOpen(true);
  };
  const handleCloseDialog = () => setDialogOpen(false);

  const handleDelete = (id) => {
    if (window.confirm("Are you sure? This will also delete related data.")) {
      deleteMutation.mutate(id, {
        onSuccess: () => notify("Branch deleted successfully", "success"),
        onError: (err) => notify(err.response?.data?.error || "Delete failed", "error"),
      });
    }
  };

  const columns = [
    { field: 'name', headerName: 'Branch Name', flex: 1.5 },
    { field: 'code', headerName: 'Code', flex: 0.5 },
    { field: 'intakeCapacity', headerName: 'Intake', flex: 0.5 },
    {
      field: 'actions', headerName: 'Actions', sortable: false, width: 150,
      renderCell: (params) => (
        <Stack direction="row">
          <IconButton color="default" title="View Details" onClick={() => navigate(`/admin/branches/${params.row._id}`)}><VisibilityIcon /></IconButton>
          <IconButton color="primary" title="Edit" onClick={() => handleOpenDialog(params.row)}><EditIcon /></IconButton>
          <IconButton color="error" title="Delete" onClick={() => handleDelete(params.row._id)}><DeleteIcon /></IconButton>
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ height: 650, width: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">Manage Branches</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add Branch
        </Button>
      </Stack>
      <DataGrid
        rows={branches}
        columns={columns}
        loading={isLoading}
        getRowId={(row) => row._id}
        sx={{ bgcolor: 'background.paper' }}
      />
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <BranchForm editingBranch={editingBranch} onClose={handleCloseDialog} />
      </Dialog>
    </Box>
  );
}