// src/features/admin/dashboard/components/StudentForm.jsx
import React, { useState, useEffect } from 'react';
import {
  DialogTitle, DialogContent, DialogActions, Button,
  TextField, Grid, CircularProgress, Select, MenuItem,
  InputLabel, FormControl,
} from '@mui/material';
import { useNotify } from '../../../../components/UI/NotificationProvider';
import { addStudent, updateStudent } from '../../../../services/student';
import { getBranches } from '../../../../services/branch';

export default function StudentForm({ editingStudent, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    scholarNo: '',
    branch: '',
  });
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const notify = useNotify();

  useEffect(() => {
    // Fetch branches for the dropdown
    const fetchBranchesForForm = async () => {
      try {
        const { data } = await getBranches();
        setBranches(data.data || []);
      } catch (error) {
        notify('Could not load branches', 'error');
      }
    };
    fetchBranchesForForm();

    // Populate form if we are editing
    if (editingStudent) {
      setForm({
        name: editingStudent.user?.name || '',
        email: editingStudent.user?.email || '',
        scholarNo: editingStudent.scholarNo || '',
        branch: editingStudent.branch?._id || '',
        password: '',
      });
    } else {
      setForm({ name: '', email: '', password: '', scholarNo: '', branch: '' });
    }
  }, [editingStudent, notify]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (editingStudent && !payload.password) {
        delete payload.password;
      }
      
      if (editingStudent) {
        await updateStudent(editingStudent._id, payload);
        notify('Student updated successfully', 'success');
      } else {
        await addStudent(payload);
        notify('Student added successfully', 'success');
      }
      onSave();
    } catch (err) {
      notify(err.response?.data?.error || 'Operation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogTitle>{editingStudent ? 'Edit Student' : 'Add New Student'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid item xs={12}>
            <TextField label="Full Name" name="name" value={form.name} onChange={handleChange} fullWidth required />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Email" name="email" type="email" value={form.email} onChange={handleChange} fullWidth required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Scholar No." name="scholarNo" value={form.scholarNo} onChange={handleChange} fullWidth required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel id="branch-select-label">Branch</InputLabel>
              <Select
                labelId="branch-select-label"
                name="branch"
                value={form.branch}
                onChange={handleChange}
                label="Branch"
              >
                {branches.map((branch) => (
                  <MenuItem key={branch._id} value={branch._id}>{branch.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {!editingStudent && (
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