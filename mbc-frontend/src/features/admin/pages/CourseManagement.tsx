import React, { useState } from 'react';
import { Box, Typography, Button, Dialog, Stack, IconButton, Tooltip } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useNotify } from '@/components/UI/NotificationProvider';
import { useCourses, useDeleteCourse } from '@/hooks/useCourses';
import CourseForm from '../components/CourseForm';
import { Course } from '@/types/api';

export default function CourseManagement() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const notify = useNotify();

    const { data: courses = [], isLoading, isError, error, refetch } = useCourses();
    const deleteMutation = useDeleteCourse();

    const handleOpenDialog = (course: Course | null = null) => {
        setEditingCourse(course);
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingCourse(null);
    };

    const handleSave = () => {
        handleCloseDialog();
        refetch();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this course?')) {
            deleteMutation.mutate(id, {
                onSuccess: () => {
                    notify('Course deleted successfully', 'success');
                    refetch();
                },
                onError: (err: any) => notify(err.response?.data?.error || err.message || 'Failed to delete', 'error'),
            });
        }
    };

    const columns: GridColDef<Course>[] = [
        { field: 'name', headerName: 'Course Name', flex: 2 },
        { field: 'code', headerName: 'Course Code', flex: 1 },
        {
            field: 'branch',
            headerName: 'Branch',
            flex: 1.5,
            valueGetter: (value, row) => row.branch?.name || 'N/A'
        },
        {
            field: 'professor',
            headerName: 'Professor',
            flex: 1.5,
            renderCell: (params: GridRenderCellParams<Course>) => {
                const professor = params.row.professor as any;
                if (!professor) return 'N/A';
                const profile = professor.user?.profile;
                return profile ? `${profile.firstName} ${profile.lastName}` : (professor.user?.name || 'N/A');
            }
        },
        { field: 'semester', headerName: 'Sem', flex: 0.5 },
        { field: 'credits', headerName: 'Credits', flex: 0.5 },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            renderCell: (params: GridRenderCellParams<Course>) => (
                <Stack direction="row" spacing={1}>
                    <Tooltip title="Edit Course">
                        <IconButton color="primary" onClick={() => handleOpenDialog(params.row)} size="small">
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Course">
                        <IconButton color="error" onClick={() => handleDelete(params.row.id)} size="small">
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
            ),
        },
    ];

    return (
        <Box sx={{ height: 'calc(100vh - 150px)', width: '100%', p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h5" fontWeight="bold">Manage Courses</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                    Add Course
                </Button>
            </Stack>

            {isError && (
                <Typography color="error" sx={{ mb: 2 }}>
                    Error: {(error as any)?.message || 'Failed to load courses'}
                </Typography>
            )}

            <DataGrid
                rows={courses}
                columns={columns}
                loading={isLoading || deleteMutation.isPending}
                getRowId={(row) => row.id}
                sx={{
                    bgcolor: 'background.paper',
                    border: 'none',
                    '& .MuiDataGrid-cell': {
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                    }
                }}
                disableRowSelectionOnClick
                autoHeight
            />

            <Dialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 2 } }}
            >
                <CourseForm
                    editingCourse={editingCourse}
                    onClose={handleCloseDialog}
                    onSave={handleSave}
                />
            </Dialog>
        </Box>
    );
}
