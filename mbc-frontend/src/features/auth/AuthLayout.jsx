import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import logo from '../../assets/Manit_Logo_color_0-removebg-preview.png';

export default function AuthLayout({ title, children, footer }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',  
        p: 2,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 420,  
          borderRadius: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <img src={logo} alt="MANIT Logo" style={{ width: 72, height: 72, marginBottom: '16px' }} />
        <Typography component="h1" variant="h5" fontWeight="bold">{title}</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Welcome to MBC Department
        </Typography>
        <Box sx={{ mt: 3, width: '100%' }}>
          {children}
        </Box>
      </Paper>
      
      {/* Footer is placed outside the Paper for clean separation */}
      {footer && (
        <Box sx={{ pt: 4, textAlign: 'center' }}>
          {footer}
        </Box>
      )}
    </Box>
  );
}