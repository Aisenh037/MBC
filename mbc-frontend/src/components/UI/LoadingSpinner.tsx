// src/components/UI/LoadingSpinner.tsx
import React from 'react';
import { CircularProgress, Box } from '@mui/material';

interface LoadingSpinnerProps {
  fullPage?: boolean;
}

/**
 * A reusable loading spinner component.
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ fullPage = false }) => {
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
};

export default LoadingSpinner;