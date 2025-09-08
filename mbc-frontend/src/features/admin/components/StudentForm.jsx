// src/features/admin/components/StudentForm.jsx
import React, { useState, useEffect } from 'react';
import {
  DialogTitle, DialogContent, DialogActions, Button,
  TextField, Grid, CircularProgress, Select, MenuItem,
  InputLabel, FormControl,
} from '@mui/material';
import { useNotify } from '../../../components/UI/NotificationProvider';
import { useAddStudent, useUpdateStudent } from '../../../hooks/useStudents';
import { useAdminBranches } from '../../../hooks/useBranches';

const departments = ["MBC", "CSE", "ECE", "EE", "MANS"];

export default function StudentForm({ editingStudent, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    scholarNo: '',
    mobile: '',
    currentSemester: 1,
    branch: '',
    department: 'MBC',
  });

  const notify = useNotify();
  const { data: branches = [], isLoading: isLoadingBranches } = useAdminBranches();
  const addMutation = useAddStudent();
  const updateMutation = useUpdateStudent();
  const isLoading = addMutation.isLoading || updateMutation.isLoading || isLoadingBranches;

  useEffect(() => {
    if (editingStudent) {
      setForm({
        name: editingStudent.user?.name || '',
        email: editingStudent.user?.email || '',
        scholarNo: editingStudent.scholarNo || '',
        mobile: editingStudent.mobile || '',
        currentSemester: editingStudent.currentSemester ?? 1,
        branch: editingStudent.branch?._id || editingStudent.branch || '',
        department: editingStudent.department || 'MBC',
        password: '',
      });
    } else {
      setForm({ 
        name: '', 
        email: '', 
        password: '', 
        scholarNo: '', 
        mobile: '',
        currentSemester: 1, 
        branch: '', 
        department: 'MBC' 
      });
    }
  }, [editingStudent]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'currentSemester') {
      setForm((f) => ({ ...f, [name]: value === '' ? '' : Number(value) }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const mutation = editingStudent ? updateMutation : addMutation;
    const payload = { ...form };

    if (editingStudent && !payload.password) {
      delete payload.password;
    }

    const finalPayload = editingStudent ? { id: editingStudent._id, data: payload } : payload;

    mutation.mutate(finalPayload, {
      onSuccess: () => {
        notify(`Student ${editingStudent ? 'updated' : 'added'} successfully`, 'success');
        onSave();
      },
      onError: (err) => {
        notify(err?.response?.data?.error || err?.message || 'An unexpected error occurred', 'error');
      },
    });
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
            <TextField
              label="Mobile Number"
              name="mobile"
              value={form.mobile}
              onChange={handleChange}
              fullWidth
              inputProps={{ maxLength: 10 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Current Semester"
              name="currentSemester"
              type="number"
              inputProps={{ min: 1 }}
              value={form.currentSemester}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Department</InputLabel>
              <Select name="department" value={form.department} label="Department" onChange={handleChange}>
                {departments.map((dept) => (<MenuItem key={dept} value={dept}>{dept}</MenuItem>))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Branch</InputLabel>
              <Select name="branch" value={form.branch} label="Branch" onChange={handleChange}>
                {isLoadingBranches ? <MenuItem disabled>Loading...</MenuItem> :
                  branches.map((b) => (<MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>))}
              </Select>
            </FormControl>
          </Grid>

          {!editingStudent && (
            <Grid item xs={12}>
              <TextField
                label="Password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                fullWidth
                required
                helperText="Set an initial password."
              />
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