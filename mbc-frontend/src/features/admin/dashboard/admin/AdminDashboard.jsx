import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import {
  AppBar, Box, Container, Grid, Paper, Toolbar, Typography, Button, Avatar, CircularProgress,
  Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, IconButton, useMediaQuery
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import CoPresentIcon from '@mui/icons-material/CoPresent';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import CampaignIcon from '@mui/icons-material/Campaign';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';

const drawerWidth = 220;

// StatCard Component
function StatCard({ item, loading }) {
  return (
    <Paper
      component={Link}
      to={item.link}
      elevation={4}
      sx={{
        p: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '12px',
        textDecoration: 'none',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'scale(1.03)',
          boxShadow: '0 8px 20px -5px rgba(0,0,0,0.2)'
        },
      }}
    >
      <Avatar sx={{ bgcolor: item.color, width: 60, height: 60, color: 'white' }}>
        {item.icon}
      </Avatar>
      <Box sx={{ textAlign: 'right' }}>
        <Typography variant="h4" fontWeight="bold">
          {loading ? <CircularProgress size={28} /> : item.count}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {item.title}
        </Typography>
      </Box>
    </Paper>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalBranches: 0,
    totalNotices: 0,
  });
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width:600px)');

  useEffect(() => {
    const fetchStats = () => {
      setLoading(true);
      axios.get("/api/analytics")
        .then(res => setStats(res.data))
        .catch(error => console.error("Error fetching analytics data:", error))
        .finally(() => setLoading(false));
    };
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const dashboardItems = [
    {
      title: 'Students',
      count: stats.totalStudents,
      icon: <PeopleOutlineIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      link: '/admin/students'
    },
    {
      title: 'Teachers',
      count: stats.totalTeachers,
      icon: <CoPresentIcon sx={{ fontSize: 40 }} />,
      color: '#388e3c',
      link: '/admin/teachers'
    },
    {
      title: 'Branches',
      count: stats.totalBranches,
      icon: <AccountTreeIcon sx={{ fontSize: 40 }} />,
      color: '#673ab7',
      link: '/admin/branches'
    },
    {
      title: 'Notices',
      count: stats.totalNotices,
      icon: <CampaignIcon sx={{ fontSize: 40 }} />,
      color: '#f57c00',
      link: '/admin/notices'
    },
  ];

  const sidebarLinks = [
    { text: 'Dashboard', icon: <DashboardIcon />, link: '/admin' },
    ...dashboardItems.map(i => ({
      text: i.title, icon: i.icon, link: i.link
    }))
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography fontWeight="bold" fontSize={18} color="primary" sx={{ width: '100%' }}>
          Admin Panel
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {sidebarLinks.map(({ text, icon, link }) => (
          <ListItem
            button
            key={text}
            component={Link}
            to={link}
            selected={location.pathname === link}
            onClick={() => isMobile && setMobileOpen(false)}
          >
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText primary={text} />
          </ListItem>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      <Button
        variant="contained"
        color="error"
        startIcon={<LogoutIcon />}
        onClick={handleLogout}
        sx={{ m: 2 }}
      >
        Logout
      </Button>
    </div>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.100' }}>
      {/* Responsive Drawer */}
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { width: drawerWidth },
            }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
            }}
            open
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      {/* Main content */}
      <Box component="main" sx={{ flexGrow: 1, pl: { sm: `${drawerWidth}px` } }}>
        <AppBar
          position="fixed"
          color="inherit"
          elevation={0}
          sx={{ left: { sm: drawerWidth }, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
        >
          <Toolbar>
            {isMobile && (
              <IconButton
                color="inherit"
                edge="start"
                onClick={() => setMobileOpen(true)}
                sx={{ mr: 2, display: { sm: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center' }}>
              Admin Dashboard
            </Typography>
          </Toolbar>
        </AppBar>

        <Container sx={{ mt: 12, mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Dashboard Overview
          </Typography>
          <Grid container spacing={3}>
            {dashboardItems.map((item) => (
              <Grid item xs={12} sm={6} md={3} key={item.title}>
                <StatCard item={item} loading={loading} />
              </Grid>
            ))}
          </Grid>
        </Container>
        {/* For routing sub-pages */}
        <Outlet />
      </Box>
    </Box>
  );
}
