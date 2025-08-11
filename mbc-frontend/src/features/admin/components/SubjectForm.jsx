// src/features/admin/components/SubjectForm.jsx
import React, { useState, useEffect } from 'react';
import {
  DialogTitle, DialogContent, DialogActions, Button,
  TextField, Grid, CircularProgress,
} from '@mui/material';
import { useNotify } from '@/components/UI/NotificationProvider';
import { useCreateSubject, useUpdateSubject } from '@/hooks/useSubjects';

export default function SubjectForm({ editingSubject, onClose }) {
  const [form, setForm] = useState({ name: '', code: '' });
  const notify = useNotify();

  useEffect(() => {
    if (editingSubject) {
      setForm({
        name: editingSubject.name || '',
        code: editingSubject.code || '',
      });
    } else {
      setForm({ name: '', code: '' });
    }
  }, [editingSubject]);

  const createMutation = useCreateSubject();
  const updateMutation = useUpdateSubject();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const mutation = editingSubject ? updateMutation : createMutation;
    const payload = editingSubject ? { id: editingSubject._id, data: form } : form;
    
    mutation.mutate(payload, {
      onSuccess: () => {
        notify(`Subject ${editingSubject ? 'updated' : 'created'} successfully`, 'success');
        onClose();
      },
      onError: (err) => notify(err.response?.data?.error || 'Operation failed', 'error'),
    });
  };

  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  return (
    <form onSubmit={handleSubmit}>
      <DialogTitle>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid item xs={12}>
            <TextField label="Subject Name" name="name" value={form.name} onChange={handleChange} fullWidth required />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Subject Code" name="code" value={form.code} onChange={handleChange} fullWidth required />
          </Grid>
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