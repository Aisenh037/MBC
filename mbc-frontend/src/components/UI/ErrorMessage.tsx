// src/components/UI/ErrorMessage.tsx
import React from 'react';
import { Alert, AlertTitle } from '@mui/material';

interface ErrorMessageProps {
  title?: string;
  message?: string | null;
}

/**
 * A reusable component to display error messages.
 */
const ErrorMessage: React.FC<ErrorMessageProps> = ({ title = 'Error', message }) => {
  if (!message) return null;

  return (
    <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
      <AlertTitle>{title}</AlertTitle>
      {message}
    </Alert>
  );
};

export default ErrorMessage;