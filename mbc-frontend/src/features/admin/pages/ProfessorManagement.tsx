import React, { useState } from 'react';
import { Box, Typography, Button, Dialog, Stack, IconButton, Tooltip } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useNotify } from '@/components/UI/NotificationProvider';
import { useAdminTeachers, useDeleteTeacher } from '@/hooks/useTeachers';
import ProfessorForm from '../components/ProfessorForm';
import { Professor } from '@/types/api';

export default function ProfessorManagement() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
    const notify = useNotify();

    const { data: professors = [], isLoading, isError, error, refetch } = useAdminTeachers();
    const deleteMutation = useDeleteTeacher();

    const handleOpenDialog = (professor: Professor | null = null) => {
        setEditingProfessor(professor);
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingProfessor(null);
        refetch();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this professor?')) {
            deleteMutation.mutate(id, {
                onSuccess: () => {
                    notify('Professor deleted successfully', 'success');
                    refetch();
                },
                onError: (err: any) => notify(err.response?.data?.error || err.message || 'Failed to delete', 'error'),
            });
        }
    };

    const columns: GridColDef<Professor>[] = [
        {
            field: 'name',
            headerName: 'Name',
            flex: 1.5,
            renderCell: (params: GridRenderCellParams<Professor>) => {
                const professor = params.row;
                const profile = professor.user?.profile;
                return profile ? `${profile.firstName} ${profile.lastName}` : (professor.user?.name || 'N/A');
            }
        },
        {
            field: 'email',
            headerName: 'Email',
            flex: 2,
            valueGetter: (value, row) => row.user?.email || 'N/A'
        },
        { field: 'employeeId', headerName: 'Employee ID', flex: 1 },
        { field: 'department', headerName: 'Department', flex: 1 },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            filterable: false,
            renderCell: (params: GridRenderCellParams<Professor>) => (
                <Stack direction="row" spacing={1}>
                    <Tooltip title="Edit Professor">
                        <IconButton color="primary" onClick={() => handleOpenDialog(params.row)} size="small">
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Professor">
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
                <Typography variant="h5" fontWeight="bold">Manage Professors</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                    Add Professor
                </Button>
            </Stack>

            {isError && (
                <Typography color="error" sx={{ mb: 2 }}>
                    Error: {(error as any)?.message || 'Failed to load professors'}
                </Typography>
            )}

            <DataGrid
                rows={professors}
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
            />

            <Dialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 2 } }}
            >
                <ProfessorForm
                    editingTeacher={editingProfessor}
                    onClose={handleCloseDialog}
                    onSave={handleCloseDialog}
                />
            </Dialog>
        </Box>
    );
}
