import React, { useState, useEffect } from 'react';
import {
    DialogTitle, DialogContent, DialogActions, Button, TextField,
    Grid, CircularProgress, MenuItem, Autocomplete
} from '@mui/material';
import { useNotify } from '@/components/UI/NotificationProvider';
import { useAddMark, useUpdateMark } from '@/hooks/useMarks';
import { useAdminStudents } from '@/hooks/useStudents';
import { useCourses } from '@/hooks/useCourses';
import { Marks, CreateMarksRequest } from '@/types/api';

interface MarkFormProps {
    editingMark: Marks | null;
    onClose: () => void;
    onSave?: () => void;
}

interface FormState {
    studentId: string;
    courseId: string;
    examType: 'assignment' | 'quiz' | 'midterm' | 'final';
    marksObtained: number;
    maxMarks: number;
    feedback: string;
}

const EXAM_TYPES = [
    { value: 'assignment', label: 'Assignment' },
    { value: 'quiz', label: 'Quiz' },
    { value: 'midterm', label: 'Midterm' },
    { value: 'final', label: 'Final' },
];

export default function MarkForm({ editingMark, onClose, onSave }: MarkFormProps) {
    const [form, setForm] = useState<FormState>({
        studentId: '',
        courseId: '',
        examType: 'assignment',
        marksObtained: 0,
        maxMarks: 100,
        feedback: ''
    });

    const notify = useNotify();
    const { data: studentsData, isLoading: isLoadingStudents } = useAdminStudents();
    const { data: courses = [], isLoading: isLoadingCourses } = useCourses();

    const students = Array.isArray(studentsData) ? studentsData : (studentsData as any)?.students || [];

    useEffect(() => {
        if (editingMark) {
            setForm({
                studentId: editingMark.studentId || editingMark.student?.id || '',
                courseId: editingMark.courseId || editingMark.course?.id || '',
                examType: editingMark.examType || 'assignment',
                marksObtained: editingMark.marksObtained || 0,
                maxMarks: editingMark.maxMarks || 100,
                feedback: editingMark.feedback || '',
            });
        } else {
            setForm({ studentId: '', courseId: '', examType: 'assignment', marksObtained: 0, maxMarks: 100, feedback: '' });
        }
    }, [editingMark]);

    const addMutation = useAddMark();
    const updateMutation = useUpdateMark();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload: CreateMarksRequest = {
            studentId: form.studentId,
            courseId: form.courseId,
            examType: form.examType,
            marksObtained: form.marksObtained,
            maxMarks: form.maxMarks,
            feedback: form.feedback,
        };

        if (editingMark) {
            updateMutation.mutate({ id: editingMark.id, data: payload }, {
                onSuccess: () => {
                    notify('Mark updated successfully', 'success');
                    onSave?.();
                    onClose();
                },
                onError: (err: any) => notify(err.response?.data?.error || err.message || 'Update failed', 'error'),
            });
        } else {
            addMutation.mutate(payload, {
                onSuccess: () => {
                    notify('Mark added successfully', 'success');
                    onSave?.();
                    onClose();
                },
                onError: (err: any) => notify(err.response?.data?.error || err.message || 'Addition failed', 'error'),
            });
        }
    };

    const isLoading = addMutation.isPending || updateMutation.isPending || isLoadingStudents || isLoadingCourses;

    return (
        <form onSubmit={handleSubmit}>
            <DialogTitle>{editingMark ? 'Edit Mark' : 'Add New Mark'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ pt: 1 }}>
                    <Grid item xs={12}>
                        <Autocomplete
                            options={students}
                            getOptionLabel={(option: any) => `${option.user?.profile?.firstName || ''} ${option.user?.profile?.lastName || option.user?.name || ''} (${option.rollNumber || option.scholarNo || ''})`}
                            value={students.find((s: any) => s.id === form.studentId) || null}
                            onChange={(_, newValue) => setForm(prev => ({ ...prev, studentId: newValue?.id || '' }))}
                            renderInput={(params) => <TextField {...params} label="Student" required />}
                            disabled={!!editingMark}
                        />
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
                        <TextField select label="Exam Type" name="examType" value={form.examType} onChange={handleChange} fullWidth required>
                            {EXAM_TYPES.map(type => <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField label="Marks Obtained" name="marksObtained" type="number" value={form.marksObtained} onChange={handleChange} fullWidth required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField label="Max Marks" name="maxMarks" type="number" value={form.maxMarks} onChange={handleChange} fullWidth required />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField label="Feedback" name="feedback" value={form.feedback} onChange={handleChange} fullWidth multiline rows={2} />
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
