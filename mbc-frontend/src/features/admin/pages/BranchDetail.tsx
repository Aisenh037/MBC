import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button, Divider, CircularProgress, Stack } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useBranchDetail } from '../../../hooks/useBranches';
import ErrorMessage from '../../../components/UI/ErrorMessage';
import { Branch } from '../../../types/api';

const BranchHeader = ({ branch }: { branch: Branch }) => (
    <Box>
        <Typography variant="h4" fontWeight="bold">{branch.name}</Typography>
        <Typography variant="subtitle1" color="text.secondary">{branch.code}</Typography>
    </Box>
);

export default function BranchDetail() {
    const { branchId } = useParams<{ branchId: string }>();
    const navigate = useNavigate();
    const { data: branch, isLoading, isError, error } = useBranchDetail(branchId);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (isError) {
        return <ErrorMessage title="Error Loading Branch" message={error?.message || 'An unknown error occurred'} />;
    }

    if (!branch) {
        return <ErrorMessage title="Not Found" message="The requested branch could not be found." />;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/admin/branches/manage')}
                    variant="outlined"
                >
                    Back to Branches
                </Button>
            </Stack>

            <Paper sx={{ p: 3, borderRadius: 2 }}>
                <BranchHeader branch={branch} />
                <Divider sx={{ my: 3 }} />

                {/* Placeholder for future detailed information */}
                <Typography variant="body1" color="text.secondary">
                    Detailed information about residents, courses, and schedules for this branch will appear here.
                </Typography>

                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>Statistics</Typography>
                    <Grid container spacing={3}>
                        {/* Statistics could be added here */}
                    </Grid>
                </Box>
            </Paper>
        </Box>
    );
}

// Fixed import for Grid if needed (locally since it was missing in snippet)
import { Grid } from '@mui/material';
