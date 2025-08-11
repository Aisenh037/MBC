// src/features/admin/pages/NoticeManagement.jsx
import React, { useState } from 'react';
import { Box, Typography, Button, Dialog, Stack, IconButton } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';


import { useNotify } from '../../../components/UI/NotificationProvider.jsx';
import NoticeForm from '../components/NoticeForm.jsx'; 
import { useNotices, useDeleteNotice } from '../../../hooks/useNotices.js';

export default function NoticeManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const notify = useNotify();

  const { data: notices = [], isLoading } = useNotices();
  const deleteMutation = useDeleteNotice();

  const handleOpenDialog = (notice = null) => {
    setEditingNotice(notice);
    setDialogOpen(true);
  };
  const handleCloseDialog = () => setDialogOpen(false);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this notice?')) {
      deleteMutation.mutate(id, {
        onSuccess: () => notify('Notice deleted successfully', 'success'),
        onError: (err) => notify(err.response?.data?.error || 'Failed to delete notice', 'error'),
      });
    }
  };

  const columns = [
      // ... columns definition from previous turn
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
        sx={{ bgcolor: 'background.paper' }}
      />
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <NoticeForm editingNotice={editingNotice} onClose={handleCloseDialog} />
      </Dialog>
    </Box>
  );
}