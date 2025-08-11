// src/features/admin/pages/ProfessorManagement.jsx
import React, { useState } from 'react';
import { Box, Typography, Button, Dialog, Stack, IconButton } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

// ✨ CORRECTED IMPORTS
import { useNotify } from '@/components/UI/NotificationProvider';
import { useAdminTeachers } from '@/hooks/useTeachers'; // Hook to get teachers
import { useDeleteTeacher } from '@/hooks/useTeachers';
import TeacherForm from '../components/TeacherForm'; // The form component

export default function ProfessorManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const notify = useNotify();

  const { data: teachers = [], isLoading } = useAdminTeachers();
  const deleteMutation = useDeleteTeacher();

  const handleOpenDialog = (teacher = null) => {
    setEditingTeacher(teacher);
    setDialogOpen(true);
  };
  const handleCloseDialog = () => setDialogOpen(false);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      deleteMutation.mutate(id, {
        onSuccess: () => notify('Teacher deleted successfully', 'success'),
        onError: (err) => notify(err.response?.data?.error || 'Failed to delete teacher', 'error'),
      });
    }
  };
  
  const columns = [
    { field: 'name', headerName: 'Name', flex: 1.5, valueGetter: (params) => params.row.user?.name || 'N/A' },
    { field: 'employeeId', headerName: 'Employee ID', flex: 1 },
    { field: 'department', headerName: 'Department', flex: 1 },
    {
      field: 'actions',
      headerName: 'Actions',
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
        <Typography variant="h5" fontWeight="bold">Manage Teachers</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add Teacher
        </Button>
      </Stack>
      <DataGrid
        rows={teachers}
        columns={columns}
        loading={isLoading}
        getRowId={(row) => row._id}
        sx={{ bgcolor: 'background.paper' }}
      />
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <TeacherForm editingTeacher={editingTeacher} onClose={handleCloseDialog} />
      </Dialog>
    </Box>
  );
}