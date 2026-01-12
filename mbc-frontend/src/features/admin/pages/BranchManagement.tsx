import React, { useState } from 'react';
import { Box, Typography, Button, Dialog, Stack, IconButton, Tooltip } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon } from "@mui/icons-material";
import { useNavigate } from 'react-router-dom';
import { useNotify } from '@/components/UI/NotificationProvider';
import { useAdminBranches, useDeleteBranch } from '@/hooks/useBranches';
import BranchForm from '../components/BranchForm';
import { Branch } from '@/types/api';

export default function BranchManagement() {
    const navigate = useNavigate();
    const notify = useNotify();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

    const { data: branches = [], isLoading, refetch } = useAdminBranches();
    const deleteMutation = useDeleteBranch();

    const handleOpenDialog = (branch: Branch | null = null) => {
        setEditingBranch(branch);
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingBranch(null);
    };

    const handleSave = () => {
        handleCloseDialog();
        refetch();
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure? This will also delete related data.")) {
            deleteMutation.mutate(id, {
                onSuccess: () => {
                    notify("Branch deleted successfully", "success");
                    refetch();
                },
                onError: (err: any) => notify(err.response?.data?.error || err.message || "Delete failed", "error"),
            });
        }
    };

    const columns: GridColDef<Branch>[] = [
        { field: 'name', headerName: 'Branch Name', flex: 1.5 },
        { field: 'code', headerName: 'Code', flex: 0.5 },
        { field: 'intakeCapacity', headerName: 'Intake', flex: 0.5 },
        {
            field: 'actions',
            headerName: 'Actions',
            sortable: false,
            width: 150,
            renderCell: (params: GridRenderCellParams<Branch>) => (
                <Stack direction="row" spacing={1}>
                    <Tooltip title="View Details">
                        <IconButton
                            color="default"
                            size="small"
                            onClick={() => navigate(`/admin/branches/${params.row.id}`)}
                        >
                            <VisibilityIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                        <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleOpenDialog(params.row)}
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                        <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDelete(params.row.id)}
                        >
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
                <Typography variant="h5" fontWeight="bold">Manage Branches</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                    Add Branch
                </Button>
            </Stack>

            <DataGrid
                rows={branches}
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
                <BranchForm
                    editingBranch={editingBranch}
                    onClose={handleCloseDialog}
                    onSave={handleSave}
                />
            </Dialog>
        </Box>
    );
}
