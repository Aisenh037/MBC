// features/admin/components/ProfessorForm.jsx
import React, { useState, useEffect } from 'react';
import { DialogTitle, DialogContent, DialogActions, Button, TextField, Grid, CircularProgress, Autocomplete, Chip } from '@mui/material';
import { useNotify } from '@/components/UI/NotificationProvider';
import { useAddTeacher, useUpdateTeacher } from '@/hooks/useTeachers';
import { useAdminBranches } from '@/hooks/useBranches'; // Hook to get branches

export default function TeacherForm({ editingTeacher, onClose }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', teacherId: '', mobile: '' });
  const [selectedBranches, setSelectedBranches] = useState([]);
  const notify = useNotify();

  const { data: allBranches = [], isLoading: isLoadingBranches } = useAdminBranches();
  const addMutation = useAddTeacher();
  const updateMutation = useUpdateTeacher();
  const isLoading = addMutation.isLoading || updateMutation.isLoading || isLoadingBranches;

  useEffect(() => {
    if (editingTeacher) {
      setForm({
        name: editingTeacher.user?.name || '',
        email: editingTeacher.user?.email || '',
        teacherId: editingTeacher.teacherId || '',
        mobile: editingTeacher.mobile || '',
        password: '',
      });
      // Set the initial branches for the Autocomplete component
      setSelectedBranches(allBranches.filter(b => editingTeacher.branches?.includes(b._id)));
    } else {
      setForm({ name: '', email: '', password: '', teacherId: '', mobile: '' });
      setSelectedBranches([]);
    }
  }, [editingTeacher, allBranches]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const mutation = editingTeacher ? updateMutation : addMutation;
    const payload = { ...form, branches: selectedBranches.map(b => b._id) }; // Add branch IDs to payload
    if (editingTeacher && !payload.password) delete payload.password;
    
    const finalPayload = editingTeacher ? { id: editingTeacher._id, data: payload } : payload;

    mutation.mutate(finalPayload, {
      onSuccess: () => {
        notify(`Professor ${editingTeacher ? 'updated' : 'added'} successfully`, 'success');
        onClose();
      },
      onError: (err) => notify(err.response?.data?.error || 'Operation failed', 'error'),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogTitle>{editingTeacher ? 'Edit Professor' : 'Add New Professor'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid item xs={12}><TextField label="Full Name" name="name" value={form.name} onChange={handleChange} fullWidth required /></Grid>
          <Grid item xs={12}><TextField label="Email" name="email" type="email" value={form.email} onChange={handleChange} fullWidth required /></Grid>
          <Grid item xs={12} sm={6}><TextField label="Teacher ID" name="teacherId" value={form.teacherId} onChange={handleChange} fullWidth required /></Grid>
          <Grid item xs={12} sm={6}><TextField label="Mobile" name="mobile" value={form.mobile} onChange={handleChange} fullWidth /></Grid>
          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={allBranches}
              getOptionLabel={(option) => option.name}
              value={selectedBranches}
              onChange={(event, newValue) => setSelectedBranches(newValue)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option.name} {...getTagProps({ index })} />
                ))
              }
              renderInput={(params) => (
                <TextField {...params} variant="outlined" label="Authorized Branches" placeholder="Select Branches" />
              )}
            />
          </Grid>
          {!editingTeacher && (
            <Grid item xs={12}><TextField label="Password" name="password" type="password" value={form.password} onChange={handleChange} fullWidth required /></Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: '0 24px 16px' }}>
        <Button onClick={onClose} disabled={isLoading}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={isLoading}>{isLoading ? <CircularProgress size={24} /> : 'Save'}</Button>
      </DialogActions>
    </form>
  );
}