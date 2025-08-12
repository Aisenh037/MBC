import { useState } from "react";
import { useAuthStore } from "../../stores/authStore";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { Box, Button, CircularProgress, TextField, Typography, Link, Stack } from "@mui/material";
import AuthLayout from "./AuthLayout";
import { useNotify } from "../../components/UI/NotificationProvider";
import CopyrightIcon from '@mui/icons-material/Copyright';

// A separate component for the footer makes the code cleaner
const LoginFooter = () => (
  <Stack
    direction="row"
    alignItems="center"
    justifyContent="center"
    spacing={0.5}
    sx={{ color: 'text.secondary' }}
  >
    <CopyrightIcon sx={{ fontSize: '1rem' }} />
    <Typography variant="caption">
      Developed by Karan Choudhary & Siddak Rajpal, MDS NIT-B'26
    </Typography>
  </Stack>
);

export default function LoginPage() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const notify = useNotify();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await login(formData);
      notify('Login successful! Redirecting...', 'success');
      navigate('/', { replace: true });
    } catch (err) {
      notify(err.message || 'Login failed. Please check credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="MBC Portal" footer={<LoginFooter />}>
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
        <TextField
          label="Email Address" name="email" type="email" required fullWidth margin="normal"
          value={formData.email} onChange={handleChange} autoComplete="email" autoFocus
        />
        <TextField
          label="Password" name="password" type="password" required fullWidth margin="normal"
          value={formData.password} onChange={handleChange} autoComplete="current-password"
        />
        <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{ mt: 3, mb: 2, py: 1.5 }}>
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
        </Button>
        <Typography variant="body2" align="center">
          <Link component={RouterLink} to="/forgot-password" variant="body2">
            Forgot Password?
          </Link>
        </Typography>
      </Box>
    </AuthLayout>
  );
}