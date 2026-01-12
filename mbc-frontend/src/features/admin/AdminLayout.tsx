// src/components/Layout/AdminLayout.tsx
import React from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

const drawerWidth = 240;

export default function AdminLayout(): React.JSX.Element {
  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'grey.100' }}>
      {/* The permanent sidebar on the left */}
      <AdminSidebar />

      {/* The main content area on the right */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: `calc(100% - ${drawerWidth}px)`,
          p: 3,
          overflowY: 'auto', // Allows content to scroll independently
        }}
      >
        {/* The header will now sit at the top of the content area */}
        <AdminHeader />

        {/* This is where your nested routes (Dashboard, Students, etc.) will be rendered */}
        <Outlet />
      </Box>
    </Box>
  );
}