import React, { useState } from 'react';
import { Box, Typography, Button, Dialog, Stack, IconButton, Tooltip, Chip } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useNotify } from '@/components/UI/NotificationProvider';
import AssignmentForm from '../components/AssignmentForm';
import { useAssignments, useDeleteAssignment } from '@/hooks/useAssignments';
import { format } from 'date-fns';
import { Assignment } from '@/types/api';

export default function AssignmentManagement() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
    const notify = useNotify();

    const { data: assignments = [], isLoading, isError, error, refetch } = useAssignments();
    const deleteMutation = useDeleteAssignment();

    const handleOpenDialog = (assignment: Assignment | null = null) => {
        setEditingAssignment(assignment);
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingAssignment(null);
    };

    const handleSave = () => {
        refetch();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this assignment?')) {
            deleteMutation.mutate(id, {
                onSuccess: () => {
                    notify('Assignment deleted successfully', 'success');
                    refetch();
                },
                onError: (err: any) => notify(err.response?.data?.error || err.message || 'Failed to delete', 'error'),
            });
        }
    };

    const columns: GridColDef<Assignment>[] = [
        { field: 'title', headerName: 'Title', flex: 2 },
        {
            field: 'course',
            headerName: 'Course',
            flex: 1.5,
            valueGetter: (value, row) => row.course?.name || 'N/A'
        },
        {
            field: 'dueDate',
            headerName: 'Due Date',
            flex: 1,
            valueGetter: (value, row) => row.dueDate ? format(new Date(row.dueDate), 'PP') : 'N/A',
        },
        {
            field: 'maxMarks',
            headerName: 'Max Marks',
            width: 100,
            type: 'number'
        },
        {
            field: 'submissions',
            headerName: 'Submissions',
            width: 150,
            renderCell: (params: GridRenderCellParams<Assignment>) => {
                const count = params.row.submissions?.length || 0;
                return (
                    <Chip
                        label={`${count} submissions`}
                        size="small"
                        color={count > 0 ? 'success' : 'default'}
                        variant="outlined"
                    />
                );
            }
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            renderCell: (params: GridRenderCellParams<Assignment>) => (
                <Stack direction="row" spacing={1}>
                    <Tooltip title="Edit Assignment">
                        <IconButton color="primary" onClick={() => handleOpenDialog(params.row)} size="small">
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Assignment">
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
                <Typography variant="h5" fontWeight="bold">Manage Assignments</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                    Add Assignment
                </Button>
            </Stack>

            {isError && (
                <Typography color="error" sx={{ mb: 2 }}>
                    Error: {(error as any)?.message || 'Failed to load assignments'}
                </Typography>
            )}

            <DataGrid
                rows={assignments}
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
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 2 } }}
            >
                <AssignmentForm
                    editingAssignment={editingAssignment}
                    onClose={handleCloseDialog}
                    onSave={handleSave}
                />
            </Dialog>
        </Box>
    );
}
