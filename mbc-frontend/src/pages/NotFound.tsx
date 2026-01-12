// src/pages/NotFound.tsx
import React from "react";
import { Box, Typography, Button, Paper } from '@mui/material';
import { Link } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'; // Icon for errors

export default function NotFound(): React.JSX.Element {
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
        <ErrorOutlineIcon sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          404 - Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Sorry, the page you are looking for could not be found.
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