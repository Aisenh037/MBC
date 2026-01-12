import React, { useState, useEffect } from 'react';
import {
    DialogTitle, DialogContent, DialogActions, Button, TextField,
    Grid, CircularProgress, MenuItem
} from '@mui/material';
import { useNotify } from '@/components/UI/NotificationProvider';
import { useCreateAssignment, useUpdateAssignment } from '@/hooks/useAssignments';
import { useCourses } from '@/hooks/useCourses';
import { Assignment, CreateAssignmentRequest } from '@/types/api';

interface AssignmentFormProps {
    editingAssignment: Assignment | null;
    onClose: () => void;
    onSave?: () => void;
}

interface FormState {
    title: string;
    description: string;
    courseId: string;
    dueDate: string;
    maxMarks: number;
}

export default function AssignmentForm({ editingAssignment, onClose, onSave }: AssignmentFormProps) {
    const [form, setForm] = useState<FormState>({
        title: '',
        description: '',
        courseId: '',
        dueDate: '',
        maxMarks: 100
    });

    const notify = useNotify();
    const { data: courses = [], isLoading: isLoadingCourses } = useCourses();

    useEffect(() => {
        if (editingAssignment) {
            setForm({
                title: editingAssignment.title || '',
                description: editingAssignment.description || '',
                courseId: editingAssignment.courseId || editingAssignment.course?.id || '',
                dueDate: editingAssignment.dueDate ? new Date(editingAssignment.dueDate).toISOString().split('T')[0] : '',
                maxMarks: editingAssignment.maxMarks || 100,
            });
        } else {
            setForm({ title: '', description: '', courseId: '', dueDate: '', maxMarks: 100 });
        }
    }, [editingAssignment]);

    const createMutation = useCreateAssignment();
    const updateMutation = useUpdateAssignment();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload: CreateAssignmentRequest = {
            title: form.title,
            description: form.description,
            courseId: form.courseId,
            dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
            maxMarks: form.maxMarks,
        };

        if (editingAssignment) {
            updateMutation.mutate({ id: editingAssignment.id, data: payload }, {
                onSuccess: () => {
                    notify('Assignment updated successfully', 'success');
                    onSave?.();
                    onClose();
                },
                onError: (err: any) => notify(err.response?.data?.error || err.message || 'Update failed', 'error'),
            });
        } else {
            createMutation.mutate(payload, {
                onSuccess: () => {
                    notify('Assignment created successfully', 'success');
                    onSave?.();
                    onClose();
                },
                onError: (err: any) => notify(err.response?.data?.error || err.message || 'Creation failed', 'error'),
            });
        }
    };

    const isLoading = createMutation.isPending || updateMutation.isPending || isLoadingCourses;

    return (
        <form onSubmit={handleSubmit}>
            <DialogTitle>{editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ pt: 1 }}>
                    <Grid item xs={12}>
                        <TextField label="Title" name="title" value={form.title} onChange={handleChange} fullWidth required />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField label="Description" name="description" value={form.description} onChange={handleChange} fullWidth multiline rows={3} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField select label="Course" name="courseId" value={form.courseId} onChange={handleChange} fullWidth required>
                            {courses.map((course: any) => (
                                <MenuItem key={course.id} value={course.id}>
                                    {course.name} ({course.code})
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField label="Max Marks" name="maxMarks" type="number" value={form.maxMarks} onChange={handleChange} fullWidth required />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField label="Due Date" name="dueDate" type="date" value={form.dueDate} onChange={handleChange} InputLabelProps={{ shrink: true }} fullWidth required />
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
