// src/features/notices/components/NoticeForm.jsx
import React, { useState, useEffect } from 'react';
import {
  DialogTitle, DialogContent, DialogActions, Button, TextField,
  Grid, CircularProgress, Select, MenuItem, InputLabel, FormControl
} from '@mui/material';
import { useNotify } from '../../../components/UI/NotificationProvider';
import { useCreateNotice, useUpdateNotice } from '../../../hooks/useNotices';
// import { getCourses } from '../../../services/courses';

export default function NoticeForm({ editingNotice, onClose }) {
  const [form, setForm] = useState({ title: '', content: '', target: 'all', class: '' });
  const [courses, setCourses] = useState([]);
  const notify = useNotify();

  useEffect(() => {
    const fetchCoursesForForm = async () => {
      try {
        const { data } = await getCourses();
        setCourses(data.data || []);
      } catch (error) {
        notify('Could not load courses for targeting', 'error');
      }
    };
    fetchCoursesForForm();
  }, [notify]);
  
  useEffect(() => {
    if (editingNotice) {
      setForm({
        title: editingNotice.title || '',
        content: editingNotice.content || '',
        target: editingNotice.target || 'all',
        class: editingNotice.class?._id || '',
      });
    } else {
      setForm({ title: '', content: '', target: 'all', class: '' });
    }
  }, [editingNotice]);

  const createMutation = useCreateNotice();
  const updateMutation = useUpdateNotice();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const mutation = editingNotice ? updateMutation : createMutation;
    const payload = editingNotice ? { id: editingNotice._id, data: form } : form;
    
    mutation.mutate(payload, {
      onSuccess: () => {
        notify(`Notice ${editingNotice ? 'updated' : 'created'} successfully`, 'success');
        onClose();
      },
      onError: (err) => notify(err.response?.data?.error || 'Operation failed', 'error'),
    });
  };

  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  return (
    <form onSubmit={handleSubmit}>
      <DialogTitle>{editingNotice ? 'Edit Notice' : 'Create New Notice'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid item xs={12}>
            <TextField label="Title" name="title" value={form.title} onChange={handleChange} fullWidth required />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Content" name="content" value={form.content} onChange={handleChange} fullWidth multiline rows={4} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Target</InputLabel>
              <Select name="target" value={form.target} label="Target" onChange={handleChange}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="students">All Students</MenuItem>
                <MenuItem value="teachers">All Teachers</MenuItem>
                <MenuItem value="class">Specific Class</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {form.target === 'class' && (
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Class</InputLabel>
                <Select name="class" value={form.class} label="Class" onChange={handleChange}>
                  {courses.map(c => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
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