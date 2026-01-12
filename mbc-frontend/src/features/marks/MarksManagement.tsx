import React, { useState } from 'react';
import { Box, Typography, Button, Dialog, Stack, IconButton, Tooltip, Chip } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useNotify } from '@/components/UI/NotificationProvider';
import MarkForm from '../admin/components/MarkForm';
import { useMarks, useDeleteMark } from '@/hooks/useMarks';
import { Marks } from '@/types/api';

export default function MarksManagement() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingMark, setEditingMark] = useState<Marks | null>(null);
    const notify = useNotify();

    const { data: marks = [], isLoading, isError, error, refetch } = useMarks();
    const deleteMutation = useDeleteMark();

    const handleOpenDialog = (mark: Marks | null = null) => {
        setEditingMark(mark);
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingMark(null);
    };

    const handleSave = () => {
        refetch();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this mark entry?')) {
            deleteMutation.mutate(id, {
                onSuccess: () => {
                    notify('Mark deleted successfully', 'success');
                    refetch();
                },
                onError: (err: any) => notify(err.response?.data?.error || err.message || 'Failed to delete', 'error'),
            });
        }
    };

    const columns: GridColDef<Marks>[] = [
        {
            field: 'student',
            headerName: 'Student',
            flex: 1.5,
            valueGetter: (value, row) => {
                const profile = row.student?.user?.profile;
                return profile ? `${profile.firstName} ${profile.lastName}` : (row.student?.user?.name || 'N/A');
            }
        },
        {
            field: 'course',
            headerName: 'Course',
            flex: 1.5,
            valueGetter: (value, row) => row.course?.name || 'N/A'
        },
        {
            field: 'examType',
            headerName: 'Exam Type',
            flex: 1,
            renderCell: (params: GridRenderCellParams<Marks>) => (
                <Chip
                    label={params.value}
                    size="small"
                    variant="outlined"
                    sx={{ textTransform: 'capitalize' }}
                />
            )
        },
        {
            field: 'marksObtained',
            headerName: 'Marks',
            width: 100,
            type: 'number',
            renderCell: (params: GridRenderCellParams<Marks>) => (
                <Typography variant="body2" fontWeight="bold">
                    {params.value} / {params.row.maxMarks}
                </Typography>
            )
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            renderCell: (params: GridRenderCellParams<Marks>) => (
                <Stack direction="row" spacing={1}>
                    <Tooltip title="Edit Mark">
                        <IconButton color="primary" onClick={() => handleOpenDialog(params.row)} size="small">
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Mark">
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
                <Typography variant="h5" fontWeight="bold">Student Marks Management</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                    Add Mark
                </Button>
            </Stack>

            {isError && (
                <Typography color="error" sx={{ mb: 2 }}>
                    Error: {(error as any)?.message || 'Failed to load marks'}
                </Typography>
            )}

            <DataGrid
                rows={marks}
                columns={columns}
                loading={isLoading}
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
                <MarkForm
                    editingMark={editingMark}
                    onClose={handleCloseDialog}
                    onSave={handleSave}
                />
            </Dialog>
        </Box>
    );
}
