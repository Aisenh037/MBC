// src/features/admin/AdminLayout.jsx
import React from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
// ✨ CORRECTED PATHS: These shared components are outside the 'features' folder
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

const drawerWidth = 240;

export default function AdminLayout() {
  return (
    <Box sx={{ display: 'flex' }}>
      <AdminSidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'grey.100',
        }}
      >
        <Box sx={{ p: 3 }}>
          <AdminHeader />
          {/* All nested admin pages (like BranchManagement) will render here */}
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}