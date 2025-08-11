// src/features/admin/dashboard/admin/components/BranchForm.jsx
import React, { useState, useEffect } from 'react';
import { DialogTitle, DialogContent, DialogActions, Button, TextField, Grid, CircularProgress } from '@mui/material';
import { useNotify } from '../../../components/UI/NotificationProvider';
import { useCreateBranch, useUpdateBranch } from '../../../hooks/useBranches.js';


export default function BranchForm({ editingBranch, onClose }) {
  const [form, setForm] = useState({ name: '', code: '', intakeCapacity: '', establishmentYear: '' });
  const notify = useNotify();

  useEffect(() => {
    if (editingBranch) {
      setForm({
        name: editingBranch.name || '',
        code: editingBranch.code || '',
        intakeCapacity: editingBranch.intakeCapacity || '',
        establishmentYear: editingBranch.establishmentYear || '',
      });
    } else {
      setForm({ name: '', code: '', intakeCapacity: '', establishmentYear: '' });
    }
  }, [editingBranch]);

  const createMutation = useCreateBranch();
  const updateMutation = useUpdateBranch();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const mutation = editingBranch ? updateMutation : createMutation;
    const payload = editingBranch ? { id: editingBranch._id, data: form } : form;

    mutation.mutate(payload, {
      onSuccess: () => {
        notify(`Branch ${editingBranch ? 'updated' : 'created'} successfully`, 'success');
        onClose();
      },
      onError: (err) => notify(err.response?.data?.error || 'Operation failed', 'error'),
    });
  };

  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  return (
    <form onSubmit={handleSubmit}>
      <DialogTitle>{editingBranch ? 'Edit Branch' : 'Add New Branch'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid item xs={12} sm={6}><TextField label="Branch Name" name="name" value={form.name} onChange={handleChange} fullWidth required /></Grid>
          <Grid item xs={12} sm={6}><TextField label="Branch Code" name="code" value={form.code} onChange={handleChange} fullWidth required /></Grid>
          <Grid item xs={12} sm={6}><TextField label="Intake Capacity" name="intakeCapacity" type="number" value={form.intakeCapacity} onChange={handleChange} fullWidth required /></Grid>
          <Grid item xs={12} sm={6}><TextField label="Establishment Year" name="establishmentYear" type="number" value={form.establishmentYear} onChange={handleChange} fullWidth required /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={isLoading}>
          {isLoading ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </DialogActions>
    </form>
  );
}