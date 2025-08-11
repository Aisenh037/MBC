// src/features/notices/NoticeManagement.jsx
import React, { useState } from 'react';
import { Box, Typography, Button, Dialog, Stack, IconButton, Chip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNotify } from '../../components/UI/NotificationProvider';
import NoticeForm from './components/NoticeForm';
import { useNotices, useDeleteNotice } from '../../hooks/useNotices';

export default function NoticeManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const notify = useNotify();

  // Fetch data using our React Query hook
  const { data: notices = [], isLoading } = useNotices();
  
  // Get the delete mutation hook
  const deleteMutation = useDeleteNotice();

  const handleOpenDialog = (notice = null) => {
    setEditingNotice(notice);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingNotice(null);
    setDialogOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this notice?')) {
      deleteMutation.mutate(id, {
        onSuccess: () => notify('Notice deleted successfully', 'success'),
        onError: (err) => notify(err.response?.data?.error || 'Failed to delete notice', 'error'),
      });
    }
  };

  const columns = [
    { field: 'title', headerName: 'Title', flex: 1.5 },
    { field: 'target', headerName: 'Target Audience', flex: 1, renderCell: (params) => <Chip label={params.value} size="small" /> },
    { field: 'class', headerName: 'Class', flex: 1, valueGetter: (params) => params.row.class?.name || 'N/A' },
    { field: 'createdBy', headerName: 'Author', flex: 1, valueGetter: (params) => params.row.createdBy?.name || 'N/A' },
    { field: 'createdAt', headerName: 'Date', width: 120, valueGetter: (params) => new Date(params.row.createdAt).toLocaleDateString() },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      width: 120,
      renderCell: (params) => (
        <Stack direction="row">
          <IconButton color="primary" onClick={() => handleOpenDialog(params.row)}><EditIcon /></IconButton>
          <IconButton color="error" onClick={() => handleDelete(params.row._id)}><DeleteIcon /></IconButton>
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ height: 650, width: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">Manage Notices</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add Notice
        </Button>
      </Stack>
      <DataGrid
        rows={notices}
        columns={columns}
        loading={isLoading}
        getRowId={(row) => row._id}
        pageSizeOptions={[10, 25, 50]}
        sx={{ bgcolor: 'background.paper', boxShadow: 2, borderRadius: 2 }}
      />
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <NoticeForm editingNotice={editingNotice} onClose={handleCloseDialog} />
      </Dialog>
    </Box>
  );
}