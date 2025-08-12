    import React, { useState } from 'react';
    import { Box, Typography, Button, Dialog, Stack, IconButton, Tooltip } from '@mui/material';
    import { DataGrid } from '@mui/x-data-grid';
    import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, MailOutline as MailIcon, Upload as UploadIcon, Download as DownloadIcon } from '@mui/icons-material';
    import { useNotify } from '../../../components/UI/NotificationProvider';
    import { useAdminStudents, useDeleteStudent, useSendResetLink, useBulkImportStudents, useBulkExportStudents } from '../../../hooks/useStudents';
    import StudentForm from '../components/StudentForm';

    export default function StudentManagement() {
      const [dialogOpen, setDialogOpen] = useState(false);
      const [editingStudent, setEditingStudent] = useState(null);
      const notify = useNotify();

      const { data: students = [], isLoading: isLoadingStudents, isError, error } = useAdminStudents();
      const deleteMutation = useDeleteStudent();
      const sendResetLinkMutation = useSendResetLink();
      const bulkImportMutation = useBulkImportStudents();
      const exportMutation = useBulkExportStudents();

      const handleOpenDialog = (student = null) => {
        setEditingStudent(student);
        setDialogOpen(true);
      };
      const handleCloseDialog = () => setDialogOpen(false);

      const handleDelete = (id) => {
        if (window.confirm('Are you sure?')) {
          deleteMutation.mutate(id, {
            onSuccess: () => notify('Student deleted successfully', 'success'),
            onError: (err) => notify(err.response?.data?.error || 'Failed to delete', 'error'),
          });
        }
      };
      
      const handleSendReset = (userId) => {
        sendResetLinkMutation.mutate(userId, {
          onSuccess: () => notify('Password reset link sent!', 'success'),
          onError: (err) => notify(err.response?.data?.error || 'Failed to send link', 'error'),
        });
      };

      const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        bulkImportMutation.mutate(file, {
          onSuccess: () => notify('Students imported successfully!', 'success'),
          onError: (err) => notify(err.response?.data?.error || 'Import failed.', 'error'),
        });
      };

      const handleExport = () => {
        exportMutation.mutate(undefined, {
          onSuccess: () => notify('Export started successfully!', 'success'),
          onError: (err) => notify(err.response?.data?.error || 'Export failed.', 'error'),
        });
      };
      
      const columns = [
        { field: 'scholarNo', headerName: 'Scholar No.', flex: 1 },
        { field: 'name', headerName: 'Name', flex: 1.5, valueGetter: (params) => params.row.user?.name },
        { field: 'branch', headerName: 'Branch', flex: 1.5, valueGetter: (params) => params.row.branch?.name },
        {
          field: 'actions',
          headerName: 'Actions',
          width: 150,
          sortable: false,
          renderCell: (params) => (
            <Stack direction="row">
              <Tooltip title="Edit"><IconButton onClick={() => handleOpenDialog(params.row)}><EditIcon color="primary" /></IconButton></Tooltip>
              <Tooltip title="Delete"><IconButton onClick={() => handleDelete(params.row._id)}><DeleteIcon color="error" /></IconButton></Tooltip>
              <Tooltip title="Send Reset Link"><IconButton onClick={() => handleSendReset(params.row.user?._id)}><MailIcon color="secondary" /></IconButton></Tooltip>
            </Stack>
          ),
        },
      ];

      return (
        <Box sx={{ height: 'calc(100vh - 150px)', width: '100%' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5" fontWeight="bold">Manage Students</Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>Add Student</Button>
              <Button variant="outlined" component="label" startIcon={<UploadIcon />} disabled={bulkImportMutation.isLoading}>Import CSV
                <input type="file" accept=".csv" hidden onChange={handleFileUpload} />
              </Button>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport} disabled={exportMutation.isLoading}>Export CSV</Button>
            </Stack>
          </Stack>
          
          <DataGrid
            rows={students}
            columns={columns}
            loading={isLoadingStudents || deleteMutation.isLoading || bulkImportMutation.isLoading}
            getRowId={(row) => row._id}
            sx={{ bgcolor: 'background.paper', border: 'none' }}
            error={isError ? error.message : null}
          />

          <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
            <StudentForm editingStudent={editingStudent} onClose={handleCloseDialog} onSave={handleCloseDialog} />
          </Dialog>
        </Box>
      );
    }