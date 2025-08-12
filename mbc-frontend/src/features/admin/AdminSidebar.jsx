// features/admin/AdminSidebar.jsx
import React from 'react';
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Divider, Box, Button } from '@mui/material';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/PeopleOutline';
import CoPresentIcon from '@mui/icons-material/CoPresent';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import CampaignIcon from '@mui/icons-material/Campaign';
import LogoutIcon from '@mui/icons-material/Logout';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HailIcon from '@mui/icons-material/Hail';

const drawerWidth = 240;

const sidebarLinks = [
  { text: 'Dashboard', icon: <DashboardIcon />, link: '/admin' },
  { text: 'Students', icon: <PeopleIcon />, link: '/admin/students' },
  { text: 'Professors', icon: <CoPresentIcon />, link: '/admin/professors' },
  { text: 'Branches', icon: <AccountTreeIcon />, link: '/admin/branches' },
  { text: 'Courses', icon: <LibraryBooksIcon />, link: '/admin/courses' },
  { text: 'Notices', icon: <CampaignIcon />, link: '/admin/notices' },
  { text: 'Assignments', icon: <AssignmentIcon />, link: '/admin/assignments' },
  { text: 'Attendance', icon: <HailIcon />, link: '/admin/attendance' },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        },
      }}
    >
      <Box>
        <Toolbar>
          <Typography variant="h6" fontWeight="bold" color="primary">Admin Panel</Typography>
        </Toolbar>
        <Divider />
        <List sx={{ p: 1 }}>
          {sidebarLinks.map(({ text, icon, link }) => (
            <ListItemButton
              key={text}
              component={NavLink}
              to={link}
              end={link === '/admin'}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.active': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                },
                '&:hover': { backgroundColor: 'action.hover' },
              }}
            >
              <ListItemIcon>{icon}</ListItemIcon>
              <ListItemText primary={text} />
            </ListItemButton>
          ))}
        </List>
      </Box>

      <Box sx={{ p: 2 }}>
        <Divider sx={{ mb: 2 }} />
        <Button variant="outlined" color="error" fullWidth startIcon={<LogoutIcon />} onClick={handleLogout}>
          Logout
        </Button>
      </Box>
    </Drawer>
  );
}