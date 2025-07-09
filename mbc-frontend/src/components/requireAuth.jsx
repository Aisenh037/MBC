// src/components/RequireAuth.jsx
import { useEffect, useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function RequireAuth({ allowedRoles = [] }) {
  const navigate = useNavigate();
  const location = useLocation();  // To return to the previous page after login
  const user = useAuthStore((state) => state.user);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      const token = localStorage.getItem('token');

      if (!user) {
        if (token) {
          try {
            await checkAuth();  // Check if token is valid
          } catch (err) {
            console.error("[RequireAuth] Token invalid or expired:", err);
            localStorage.removeItem('token');
            return navigate('/login', { replace: true, state: { from: location } });  // Redirect to login with the previous page
          }
        } else {
          return navigate('/login', { replace: true, state: { from: location } });  // Redirect to login if no token
        }
      }

      // Handle role-based access after successful auth
      if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
        return navigate('/unauthorized', { replace: true });
      }

      setLoading(false); // Set loading to false once everything is checked
    };

    verify();
  }, [user, checkAuth, navigate, location, allowedRoles]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <CircularProgress />
        <Typography variant="body1">Verifying access...</Typography>
      </Box>
    );
  }

  return <Outlet />;
}
