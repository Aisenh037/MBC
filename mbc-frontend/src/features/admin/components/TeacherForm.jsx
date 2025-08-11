// src/features/admin/dashboard/components/TeacherForm.jsx
import React, { useState, useEffect } from 'react';
import {
  DialogTitle, DialogContent, DialogActions, Button,
  TextField, Grid, CircularProgress,
} from '@mui/material';
import { useNotify } from '../../../components/UI/NotificationProvider.jsx';
import { useAddTeacher, useUpdateTeacher } from '@/hooks/useTeachers.js';

export default function TeacherForm({ editingTeacher, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    employeeId: '',
    department: 'MBC',
  });
  const [loading, setLoading] = useState(false);
  const notify = useNotify();

  useEffect(() => {
    if (editingTeacher) {
      setForm({
        name: editingTeacher.user?.name || '',
        email: editingTeacher.user?.email || '',
        employeeId: editingTeacher.employeeId || '',
        department: editingTeacher.department || 'MBC',
        password: '', // Password is not edited, only set for new users
      });
    } else {
      setForm({ name: '', email: '', password: '', employeeId: '', department: 'MBC' });
    }
  }, [editingTeacher]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addTeacherMutation = useAddTeacher();
  const updateTeacherMutation = useUpdateTeacher();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (editingTeacher && !payload.password) {
        delete payload.password; // Don't send empty password on update
      }
      
      if (editingTeacher) {
        await updateTeacherMutation.mutateAsync({ id: editingTeacher._id, data: payload });
        notify('Teacher updated successfully', 'success');
      } else {
        await addTeacherMutation.mutateAsync(payload);
        notify('Teacher added successfully', 'success');
      }
      onSave(); // Trigger refresh and close dialog
    } catch (err) {
      notify(err.response?.data?.error || 'Operation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogTitle>{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid item xs={12}>
            <TextField label="Full Name" name="name" value={form.name} onChange={handleChange} fullWidth required />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Email" name="email" type="email" value={form.email} onChange={handleChange} fullWidth required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Employee ID" name="employeeId" value={form.employeeId} onChange={handleChange} fullWidth required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Department" name="department" value={form.department} onChange={handleChange} fullWidth required />
          </Grid>
          {!editingTeacher && (
            <Grid item xs={12}>
              <TextField label="Password" name="password" type="password" value={form.password} onChange={handleChange} fullWidth required />
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: '0 24px 16px' }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </DialogActions>
    </form>
    );
  }