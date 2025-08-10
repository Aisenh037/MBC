// src/components/Layout/AdminSidebar.jsx
import React from 'react';
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Divider, Box } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/PeopleOutline';
import CoPresentIcon from '@mui/icons-material/CoPresent';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import CampaignIcon from '@mui/icons-material/Campaign';

const drawerWidth = 240;

const sidebarLinks = [
  { text: 'Dashboard', icon: <DashboardIcon />, link: '/admin' },
  { text: 'Students', icon: <PeopleIcon />, link: '/admin/students' },
  { text: 'Teachers', icon: <CoPresentIcon />, link: '/admin/teachers' },
  { text: 'Branches', icon: <AccountTreeIcon />, link: '/admin/branches' },
  { text: 'Courses', icon: <LibraryBooksIcon />, link: '/admin/courses' },
  { text: 'Notices', icon: <CampaignIcon />, link: '/admin/notices' },
];

export default function AdminSidebar() {
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      <Toolbar>
        <Typography variant="h6" fontWeight="bold" color="primary">
          Admin Panel
        </Typography>
      </Toolbar>
      <Divider />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {sidebarLinks.map(({ text, icon, link }) => (
            <ListItemButton
              key={text}
              component={Link}
              to={link}
              selected={location.pathname.startsWith(link)} // Use startsWith for nested routes
            >
              <ListItemIcon>{icon}</ListItemIcon>
              <ListItemText primary={text} />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Drawer>
  );
}