// src/features/admin/components/TeacherForm.jsx
import React, { useState, useEffect } from 'react';
import {
  DialogTitle, DialogContent, DialogActions, Button,
  TextField, Grid, CircularProgress,
} from '@mui/material';
import { useNotify } from '@/components/UI/NotificationProvider';
import { useAddTeacher, useUpdateTeacher } from '@/hooks/useTeachers';

export default function TeacherForm({ editingTeacher, onClose }) {
  // State to manage the form's input fields
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    employeeId: '',
    department: 'MBC',
  });
  const notify = useNotify();

  // This effect runs when the component loads or when 'editingTeacher' changes.
  // It populates the form with the teacher's data if we are editing.
  useEffect(() => {
    if (editingTeacher) {
      setForm({
        name: editingTeacher.user?.name || '',
        email: editingTeacher.user?.email || '',
        employeeId: editingTeacher.employeeId || '',
        department: editingTeacher.department || 'MBC',
        password: '', // Password is not shown or edited
      });
    } else {
      // If we are adding a new teacher, reset the form
      setForm({ name: '', email: '', password: '', employeeId: '', department: 'MBC' });
    }
  }, [editingTeacher]);

  // Get the mutation hooks from React Query
  const addMutation = useAddTeacher();
  const updateMutation = useUpdateTeacher();

  // A single handler to update the form state as the user types
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

// This function is called when the user clicks the "Save" button
  const isLoading = addMutation.isLoading || updateMutation.isLoading;

  const handleSubmit = (e) => {
    e.preventDefault();

    // Choose which mutation to use: update if editing, create if not
    const mutation = editingTeacher ? updateMutation : addMutation;
    const payload = editingTeacher ? { id: editingTeacher._id, data: form } : form;

    // Execute the mutation
    mutation.mutate(payload, {
      onSuccess: () => {
        notify(`Teacher ${editingTeacher ? 'updated' : 'added'} successfully`, 'success');
        onClose(); // Close the dialog
      },
      onError: (err) => {
        notify(err.response?.data?.error || 'Operation failed', 'error');
      },
    });
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
          {/* Only show the password field when creating a new teacher */}
          {!editingTeacher && (
            <Grid item xs={12}>
              <TextField label="Password" name="password" type="password" value={form.password} onChange={handleChange} fullWidth required />
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: '0 24px 16px' }}>
        <Button onClick={onClose} disabled={isLoading}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={isLoading}>
          {isLoading ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </DialogActions>
    </form>
  );
}