import React, { useState } from 'react';
import {
    Box, Typography, Button, Dialog, Stack,
    IconButton, Tooltip, CircularProgress, Chip
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Upload as UploadIcon,
    Download as DownloadIcon,
    Visibility as ViewIcon,
    Refresh as ResetIcon
} from '@mui/icons-material';
import { useNotify } from '../../../components/UI/NotificationProvider';
import {
    useAdminStudents,
    useDeleteStudent,
    useSendResetLink,
    useBulkImportStudents,
    useBulkExportStudents,
} from '../../../hooks/useStudents';
import StudentForm from '../components/StudentForm';
import { Student } from '../../../types/api';

export default function StudentManagement() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [viewMode, setViewMode] = useState(false);
    const notify = useNotify();

    const {
        data: students = [],
        isLoading: isLoadingStudents,
        isError,
        error,
        refetch
    } = useAdminStudents();

    const deleteMutation = useDeleteStudent();
    const sendResetLinkMutation = useSendResetLink();
    const bulkImportMutation = useBulkImportStudents();
    const exportMutation = useBulkExportStudents();

    const handleOpenDialog = (student: Student | null = null, view = false) => {
        setEditingStudent(student);
        setViewMode(view);
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingStudent(null);
        setViewMode(false);
        refetch();
    };

    const handleDelete = (id: string) => {
        if (!id) return;
        if (window.confirm('Are you sure you want to delete this student?')) {
            deleteMutation.mutate(id, {
                onSuccess: () => {
                    notify('Student deleted successfully', 'success');
                    refetch();
                },
                onError: (err: any) => notify(err?.response?.data?.error || err?.message || 'Failed to delete student', 'error'),
            });
        }
    };

    const handleSendReset = (userId: string | undefined) => {
        if (!userId) return notify('Missing user ID', 'error');
        sendResetLinkMutation.mutate(userId, {
            onSuccess: () => notify('Password reset link sent successfully!', 'success'),
            onError: (err: any) => notify(err?.response?.data?.error || err?.message || 'Failed to send reset link', 'error'),
        });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        bulkImportMutation.mutate(file, {
            onSuccess: () => {
                notify('Students imported successfully!', 'success');
                refetch();
            },
            onError: (err: any) => notify(err?.response?.data?.error || err?.message || 'Import failed', 'error'),
        });
        e.target.value = '';
    };

    const handleExport = () => {
        exportMutation.mutate(undefined, {
            onSuccess: () => notify('Export started successfully', 'success'),
            onError: (err: any) => notify(err?.response?.data?.error || err?.message || 'Export failed', 'error'),
        });
    };

    const columns: GridColDef<Student>[] = [
        {
            field: 'rollNumber',
            headerName: 'Roll No.',
            flex: 1,
            valueGetter: (value, row) => row.rollNumber || 'N/A'
        },
        {
            field: 'name',
            headerName: 'Name',
            flex: 1.5,
            valueGetter: (value, row) => {
                const profile = row.user?.profile;
                return profile ? `${profile.firstName} ${profile.lastName}` : 'N/A';
            }
        },
        {
            field: 'email',
            headerName: 'Email',
            flex: 2,
            valueGetter: (value, row) => row.user?.email || 'N/A'
        },
        {
            field: 'isActive',
            headerName: 'Status',
            flex: 1,
            renderCell: (params) => (
                <Chip
                    label={params.row.isActive ? 'Active' : 'Inactive'}
                    color={params.row.isActive ? 'success' : 'error'}
                    size="small"
                />
            )
        },
        {
            field: 'branch',
            headerName: 'Branch',
            flex: 1.5,
            valueGetter: (value, row) => row.branch?.name || 'N/A'
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 220,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <Stack direction="row" spacing={0.5}>
                    <Tooltip title="View">
                        <IconButton
                            onClick={() => handleOpenDialog(params.row, true)}
                            size="small"
                            color="info"
                        >
                            <ViewIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                        <IconButton
                            onClick={() => handleOpenDialog(params.row)}
                            size="small"
                            color="primary"
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                        <IconButton
                            onClick={() => handleDelete(params.row.id)}
                            size="small"
                            color="error"
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Send Reset Link">
                        <IconButton
                            onClick={() => handleSendReset(params.row.user?.id)}
                            size="small"
                            color="secondary"
                        >
                            <ResetIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
            ),
        },
    ];

    return (
        <Box sx={{ height: 'calc(100vh - 64px)', width: '100%', p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">Student Management</Typography>
                <Stack direction="row" spacing={2}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                        sx={{ minWidth: 150 }}
                        disabled={isLoadingStudents}
                    >
                        {isLoadingStudents ? <CircularProgress size={24} /> : 'Add Student'}
                    </Button>
                    <Button
                        variant="outlined"
                        component="label"
                        startIcon={<UploadIcon />}
                        disabled={bulkImportMutation.isPending}
                        sx={{ minWidth: 150 }}
                    >
                        {bulkImportMutation.isPending ? <CircularProgress size={24} /> : 'Import CSV'}
                        <input type="file" accept=".csv" hidden onChange={handleFileUpload} />
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleExport}
                        disabled={exportMutation.isPending}
                        sx={{ minWidth: 150 }}
                    >
                        {exportMutation.isPending ? <CircularProgress size={24} /> : 'Export CSV'}
                    </Button>
                </Stack>
            </Stack>

            {isError && (
                <Box sx={{
                    bgcolor: 'error.light',
                    p: 2,
                    mb: 2,
                    borderRadius: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Typography color="error">
                        Error loading students: {(error as any)?.message || 'Unknown error'}
                    </Typography>
                    <Button variant="outlined" color="error" onClick={() => refetch()}>
                        Retry
                    </Button>
                </Box>
            )}

            <Box sx={{ height: '70vh', width: '100%', mt: 2 }}>
                <DataGrid
                    rows={students}
                    columns={columns}
                    loading={isLoadingStudents || deleteMutation.isPending || bulkImportMutation.isPending}
                    getRowId={(row) => row.id}
                    sx={{
                        '& .MuiDataGrid-cell': {
                            borderBottom: 'none',
                        },
                        '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: 'background.default',
                            borderBottom: 'none',
                        },
                        '& .MuiDataGrid-virtualScroller': {
                            backgroundColor: 'background.paper',
                        },
                    }}
                    initialState={{
                        pagination: {
                            paginationModel: { page: 0, pageSize: 10 },
                        },
                    }}
                    pageSizeOptions={[10, 25, 50]}
                    disableColumnMenu
                    disableRowSelectionOnClick
                />
            </Box>

            <Dialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 2 } }}
            >
                <StudentForm
                    editingStudent={editingStudent}
                    onClose={handleCloseDialog}
                    onSave={handleCloseDialog}
                    viewMode={viewMode}
                />
            </Dialog>
        </Box>
    );
}
