import React from 'react';
import { Box, Drawer, Toolbar, Typography, Divider, List, ListItemButton, ListItemIcon, ListItemText, Button } from '@mui/material';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import AdminHeader from '@/features/admin/AdminHeader'; // Can be a generic header
import LogoutIcon from '@mui/icons-material/Logout';

const drawerWidth = 240;

interface SidebarLink {
    text: string;
    icon: React.ReactNode;
    link: string;
}

interface DashboardLayoutProps {
    sidebarLinks: SidebarLink[];
    title: string;
}

export default function DashboardLayout({ sidebarLinks, title }: DashboardLayoutProps) {
    const navigate = useNavigate();
    const logout = useAuthStore((state) => state.logout);

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    const drawer = (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
            <Box>
                <Toolbar>
                    <Typography variant="h6" fontWeight="bold" color="primary">{title}</Typography>
                </Toolbar>
                <Divider />
                <List sx={{ p: 1 }}>
                    {sidebarLinks.map(({ text, icon, link }) => (
                        <ListItemButton
                            key={text}
                            component={NavLink}
                            to={link}
                            end={link.endsWith('/admin')}
                            sx={{
                                '&.active': {
                                    bgcolor: 'action.selected',
                                    color: 'primary.main',
                                    '& .MuiListItemIcon-root': {
                                        color: 'primary.main',
                                    },
                                },
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
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'grey.100' }}>
            <Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink: 0, '& .MuiDrawer-paper': { width: drawerWidth } }}>
                {drawer}
            </Drawer>
            <Box component="main" sx={{ flexGrow: 1, p: 3, overflowY: 'auto' }}>
                <AdminHeader />
                <Outlet />
            </Box>
        </Box>
    );
}
