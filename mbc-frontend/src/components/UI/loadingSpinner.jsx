// src/components/UI/LoadingSpinner.jsx
import React from 'react';
import { CircularProgress, Box } from '@mui/material';

/**
 * A reusable loading spinner component.
 * @param {{ fullPage: boolean }} props - If true, spinner is centered on the full page.
 */
export default function LoadingSpinner({ fullPage = false }) {
  if (fullPage) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'calc(100vh - 68px)', // Adjust height based on your layout
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return <CircularProgress />;
}   