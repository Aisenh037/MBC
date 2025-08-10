// src/components/UI/ErrorMessage.jsx
import React from 'react';
import { Alert, AlertTitle } from '@mui/material';

/**
 * A reusable component to display error messages.
 * @param {{ title: string, message: string }} props - The title and content of the error.
 */
export default function ErrorMessage({ title = 'Error', message }) {
  if (!message) return null;

  return (
    <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
      <AlertTitle>{title}</AlertTitle>
      {message}
    </Alert>
  );
}