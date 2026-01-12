// src/features/auth/RegisterPage.tsx
import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Button, CircularProgress, TextField, Typography, Link,
  Select, MenuItem, FormControl, InputLabel, Grid, SelectChangeEvent
} from '@mui/material';
import AuthLayout from './AuthLayout';
import { useNotify } from '../../components/UI/NotificationProvider';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'teacher';
  scholarNo: string;
  employeeId: string;
}

export default function RegisterPage(): React.JSX.Element {
  const { register } = useAuthStore();
  const navigate = useNavigate();
  const notify = useNotify();

  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    role: 'student', // Default role
    scholarNo: '',
    employeeId: '',
  });
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(formData);
      notify('Registration successful! Please log in.', 'success');
      navigate('/'); // Redirect to login page on success
    } catch (err: any) {
      notify(err.response?.data?.error || 'Registration failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create an Account">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField label="Full Name" name="name" value={formData.name} onChange={handleChange} required fullWidth />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} required fullWidth />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required fullWidth />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>I am a...</InputLabel>
              <Select name="role" value={formData.role} label="I am a..." onChange={handleSelectChange}>
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="teacher">Teacher</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {formData.role === 'student' && (
            <Grid item xs={12}>
              <TextField label="Scholar Number" name="scholarNo" value={formData.scholarNo} onChange={handleChange} required fullWidth />
            </Grid>
          )}
          {formData.role === 'teacher' && (
            <Grid item xs={12}>
              <TextField label="Employee ID" name="employeeId" value={formData.employeeId} onChange={handleChange} required fullWidth />
            </Grid>
          )}
        </Grid>
        <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{ mt: 3, mb: 2, py: 1.5 }}>
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
        </Button>
        <Typography variant="body2" align="center">
          Already have an account?{' '}
          <Link component={RouterLink} to="/" variant="body2">
            Sign In
          </Link>
        </Typography>
      </Box>
    </AuthLayout>
  );
}