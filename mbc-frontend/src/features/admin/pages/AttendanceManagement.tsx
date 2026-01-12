import React, { useState } from 'react';
import { Box, Typography, Button, Dialog, Stack, IconButton, Tooltip, Chip } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import { useNotify } from '@/components/UI/NotificationProvider';
import AttendanceForm from '../components/AttendanceForm';
import { useAttendance } from '@/hooks/useAttendance';
import { format } from 'date-fns';
import { Attendance } from '@/types/api';

export default function AttendanceManagement() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null);
    const notify = useNotify();

    const { data: attendance = [], isLoading, isError, error, refetch } = useAttendance();

    const handleOpenDialog = (record: Attendance | null = null) => {
        setEditingAttendance(record);
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingAttendance(null);
    };

    const handleSave = () => {
        refetch();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'present': return 'success';
            case 'absent': return 'error';
            case 'late': return 'warning';
            default: return 'default';
        }
    };

    const columns: GridColDef<Attendance>[] = [
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
            field: 'date',
            headerName: 'Date',
            flex: 1,
            valueGetter: (value, row) => row.date ? format(new Date(row.date), 'PP') : 'N/A',
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            renderCell: (params: GridRenderCellParams<Attendance>) => (
                <Chip
                    label={params.value}
                    size="small"
                    color={getStatusColor(params.value as string) as any}
                />
            )
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 100,
            sortable: false,
            renderCell: (params: GridRenderCellParams<Attendance>) => (
                <Stack direction="row" spacing={1}>
                    <Tooltip title="Edit Record">
                        <IconButton color="primary" onClick={() => handleOpenDialog(params.row)} size="small">
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
            ),
        },
    ];

    return (
        <Box sx={{ height: 'calc(100vh - 150px)', width: '100%', p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h5" fontWeight="bold">Attendance Management</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                    Mark Attendance
                </Button>
            </Stack>

            {isError && (
                <Typography color="error" sx={{ mb: 2 }}>
                    Error: {(error as any)?.message || 'Failed to load attendance records'}
                </Typography>
            )}

            <DataGrid
                rows={attendance}
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
                <AttendanceForm
                    editingAttendance={editingAttendance}
                    onClose={handleCloseDialog}
                    onSave={handleSave}
                />
            </Dialog>
        </Box>
    );
}
