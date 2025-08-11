// src/features/marks/components/MarkForm.jsx
import React, { useState, useEffect } from 'react';
import {
  DialogTitle, DialogContent, DialogActions, Button, TextField,
  Grid, CircularProgress, Select, MenuItem, InputLabel, FormControl, Autocomplete
} from '@mui/material';
import { useNotify } from '../../../components/UI/NotificationProvider';
import { useAddMark, useUpdateMark } from '../../../hooks/useMarks';
import { getStudents } from '../../../services/student';
import { getSubjects } from '../../../services/subjects';

const EXAM_TYPES = ["Midterm", "Endterm", "Assignment", "Quiz", "Other"];

export default function MarkForm({ editingMark, onClose }) {
  const [form, setForm] = useState({ student: '', subject: '', examType: '', marksObtained: '', maxMarks: '', remarks: '' });
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const notify = useNotify();

  useEffect(() => {
    const fetchDataForForm = async () => {
      const [studentsRes, subjectsRes] = await Promise.all([getStudents(), getSubjects()]);
      setStudents(studentsRes.data.data || []);
      setSubjects(subjectsRes.data.data || []);
    };
    fetchDataForForm();
  }, []);
  
  useEffect(() => {
    if (editingMark) {
      setForm({
        student: editingMark.student?._id || '',
        subject: editingMark.subject?._id || '',
        examType: editingMark.examType || '',
        marksObtained: editingMark.marksObtained || '',
        maxMarks: editingMark.maxMarks || '',
        remarks: editingMark.remarks || '',
      });
    } else {
      setForm({ student: '', subject: '', examType: '', marksObtained: '', maxMarks: '', remarks: '' });
    }
  }, [editingMark]);

  const addMutation = useAddMark();
  const updateMutation = useUpdateMark();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  
  const handleAutocompleteChange = (name, value) => {
    setForm({ ...form, [name]: value?._id || '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const mutation = editingMark ? updateMutation : addMutation;
    const payload = editingMark ? { id: editingMark._id, data: form } : form;
    
    mutation.mutate(payload, {
      onSuccess: () => {
        notify(`Mark ${editingMark ? 'updated' : 'added'} successfully`, 'success');
        onClose();
      },
      onError: (err) => notify(err.response?.data?.error || 'Operation failed', 'error'),
    });
  };

  const isLoading = addMutation.isLoading || updateMutation.isLoading;

  return (
    <form onSubmit={handleSubmit}>
      <DialogTitle>{editingMark ? 'Edit Mark' : 'Add New Mark'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid item xs={12}>
            <Autocomplete
              options={students}
              getOptionLabel={(option) => `${option.user?.name} (${option.scholarNo})`}
              value={students.find(s => s._id === form.student) || null}
              onChange={(event, newValue) => handleAutocompleteChange('student', newValue)}
              renderInput={(params) => <TextField {...params} label="Student" required />}
              disabled={!!editingMark}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Subject</InputLabel>
              <Select name="subject" value={form.subject} label="Subject" onChange={handleChange}>
                {subjects.map(s => <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Exam Type</InputLabel>
              <Select name="examType" value={form.examType} label="Exam Type" onChange={handleChange}>
                {EXAM_TYPES.map(type => <MenuItem key={type} value={type}>{type}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Marks Obtained" name="marksObtained" type="number" value={form.marksObtained} onChange={handleChange} fullWidth required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Max Marks" name="maxMarks" type="number" value={form.maxMarks} onChange={handleChange} fullWidth required />
          </Grid>
           <Grid item xs={12}>
                <TextField label="Remarks (Optional)" name="remarks" value={form.remarks} onChange={handleChange} fullWidth multiline rows={2} />
           </Grid>
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