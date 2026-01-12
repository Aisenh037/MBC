// src/pages/Unauthorized.tsx
import React from "react";
import { Box, Typography, Button, Paper } from '@mui/material';
import { Link } from 'react-router-dom';
import BlockIcon from '@mui/icons-material/Block'; // Icon for unauthorized access

export default function Unauthorized(): React.JSX.Element {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 150px)', // Adjust height based on layout
        textAlign: 'center',
        p: 3,
      }}
    >
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2, maxWidth: 500 }}>
        <BlockIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          You do not have the necessary permissions to view this page.
        </Typography>
        <Button
          component={Link}
          to="/"
          variant="contained"
          color="primary"
        >
          Go to Home
        </Button>
      </Paper>
    </Box>
  );
}