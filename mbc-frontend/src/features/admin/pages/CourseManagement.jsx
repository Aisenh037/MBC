// features/admin/pages/CourseManagement.jsx
import React, { useState } from 'react';
import { Box, Typography, Button, Dialog, Stack, IconButton, Tooltip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useNotify } from '@/components/UI/NotificationProvider';
import { useCourses, useDeleteCourse } from '@/hooks/useCourses'; // You will need to create these hooks
import CourseForm from '../components/CourseForm'; // You will need to create this form

export default function CourseManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const notify = useNotify();

  const { data: courses = [], isLoading, isError, error } = useCourses();
  const deleteMutation = useDeleteCourse();

  const handleOpenDialog = (course = null) => {
    setEditingCourse(course);
    setDialogOpen(true);
  };
  const handleCloseDialog = () => setDialogOpen(false);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure?')) {
      deleteMutation.mutate(id, {
        onSuccess: () => notify('Course deleted successfully', 'success'),
        onError: (err) => notify(err.response?.data?.error || 'Failed to delete', 'error'),
      });
    }
  };

  const columns = [
    { field: 'name', headerName: 'Course Name', flex: 2 },
    { field: 'code', headerName: 'Course Code', flex: 1 },
    { field: 'branch', headerName: 'Branch', flex: 1.5, valueGetter: (params) => params.row.branch?.name },
    { field: 'semester', headerName: 'Semester', flex: 1 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row">
          <Tooltip title="Edit Course"><IconButton color="primary" onClick={() => handleOpenDialog(params.row)}><EditIcon /></IconButton></Tooltip>
          <Tooltip title="Delete Course"><IconButton color="error" onClick={() => handleDelete(params.row._id)}><DeleteIcon /></IconButton></Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ height: 'calc(100vh - 150px)', width: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">Manage Courses</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>Add Course</Button>
      </Stack>
      <DataGrid
        rows={courses}
        columns={columns}
        loading={isLoading || deleteMutation.isLoading}
        getRowId={(row) => row._id}
        sx={{ bgcolor: 'background.paper', border: 'none' }}
        error={isError ? error.message : null}
      />
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <CourseForm editingCourse={editingCourse} onClose={handleCloseDialog} />
      </Dialog>
    </Box>
  );
}