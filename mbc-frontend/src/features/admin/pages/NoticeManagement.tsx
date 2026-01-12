import React, { useState } from 'react';
import { Box, Typography, Button, Dialog, Stack, IconButton, Tooltip, Chip } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useNotify } from '@/components/UI/NotificationProvider';
import NoticeForm from '../components/NoticeForm';
import { useNotices, useDeleteNotice } from '@/hooks/useNotices';
import { format } from 'date-fns';
import { Notice } from '@/types/api';

export default function NoticeManagement() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
    const notify = useNotify();

    const { data: noticesData, isLoading, isError, error, refetch } = useNotices();
    // Depending on the hook implementation, notices might be in data.notices or just data
    const notices = (noticesData as any)?.notices || (Array.isArray(noticesData) ? noticesData : []);

    const deleteMutation = useDeleteNotice();

    const handleOpenDialog = (notice: Notice | null = null) => {
        setEditingNotice(notice);
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingNotice(null);
    };

    const handleSave = () => {
        refetch();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this notice?')) {
            deleteMutation.mutate(id, {
                onSuccess: () => {
                    notify('Notice deleted successfully', 'success');
                    refetch();
                },
                onError: (err: any) => notify(err.response?.data?.error || err.message || 'Failed to delete', 'error'),
            });
        }
    };

    const columns: GridColDef<Notice>[] = [
        { field: 'title', headerName: 'Title', flex: 2 },
        {
            field: 'targetAudience',
            headerName: 'Audience',
            flex: 1,
            renderCell: (params: GridRenderCellParams<Notice>) => {
                const audience = params.row.targetAudience || [];
                return (
                    <Stack direction="row" spacing={0.5}>
                        {audience.map(a => (
                            <Chip
                                key={a}
                                label={a.includes(':') ? a.split(':')[1] : a}
                                size="small"
                                variant="outlined"
                            />
                        ))}
                    </Stack>
                );
            }
        },
        {
            field: 'priority',
            headerName: 'Priority',
            width: 100,
            renderCell: (params: GridRenderCellParams<Notice>) => (
                <Chip
                    label={params.value}
                    size="small"
                    color={
                        params.value === 'urgent' ? 'error' :
                            params.value === 'high' ? 'warning' :
                                params.value === 'low' ? 'default' : 'primary'
                    }
                />
            )
        },
        {
            field: 'createdAt',
            headerName: 'Published On',
            flex: 1,
            valueGetter: (value, row) => row?.createdAt ? format(new Date(row.createdAt), 'PP') : 'N/A',
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            renderCell: (params: GridRenderCellParams<Notice>) => (
                <Stack direction="row" spacing={1}>
                    <Tooltip title="Edit Notice">
                        <IconButton color="primary" onClick={() => handleOpenDialog(params.row)} size="small">
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Notice">
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
                <Typography variant="h5" fontWeight="bold">Manage Notices</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                    Add Notice
                </Button>
            </Stack>

            {isError && (
                <Typography color="error" sx={{ mb: 2 }}>
                    Error: {(error as any)?.message || 'Failed to load notices'}
                </Typography>
            )}

            <DataGrid
                rows={notices}
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
                <NoticeForm
                    editingNotice={editingNotice}
                    onClose={handleCloseDialog}
                    onSave={handleSave}
                />
            </Dialog>
        </Box>
    );
}
