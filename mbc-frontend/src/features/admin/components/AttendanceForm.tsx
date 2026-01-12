import React, { useState, useEffect } from 'react';
import {
    DialogTitle, DialogContent, DialogActions, Button, TextField,
    Grid, CircularProgress, MenuItem
} from '@mui/material';
import { useNotify } from '@/components/UI/NotificationProvider';
import { useMarkAttendance } from '@/hooks/useAttendance';
import { useAdminStudents } from '@/hooks/useStudents';
import { useCourses } from '@/hooks/useCourses';
import { Attendance, CreateAttendanceRequest } from '@/types/api';

interface AttendanceFormProps {
    editingAttendance: Attendance | null;
    onClose: () => void;
    onSave?: () => void;
}

interface FormState {
    studentId: string;
    courseId: string;
    date: string;
    status: 'present' | 'absent' | 'late';
}

export default function AttendanceForm({ editingAttendance, onClose, onSave }: AttendanceFormProps) {
    const [form, setForm] = useState<FormState>({
        studentId: '',
        courseId: '',
        date: new Date().toISOString().split('T')[0],
        status: 'present'
    });

    const notify = useNotify();
    const { data: studentsData, isLoading: isLoadingStudents } = useAdminStudents();
    const { data: courses = [], isLoading: isLoadingCourses } = useCourses();

    const students = Array.isArray(studentsData) ? studentsData : (studentsData as any)?.students || [];

    useEffect(() => {
        if (editingAttendance) {
            setForm({
                studentId: editingAttendance.studentId || editingAttendance.student?.id || '',
                courseId: editingAttendance.courseId || editingAttendance.course?.id || '',
                date: editingAttendance.date ? new Date(editingAttendance.date).toISOString().split('T')[0] : '',
                status: editingAttendance.status || 'present',
            });
        } else {
            setForm({
                studentId: '',
                courseId: '',
                date: new Date().toISOString().split('T')[0],
                status: 'present'
            });
        }
    }, [editingAttendance]);

    const markMutation = useMarkAttendance();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload: CreateAttendanceRequest = {
            studentId: form.studentId,
            courseId: form.courseId,
            date: new Date(form.date).toISOString(),
            status: form.status,
        };

        markMutation.mutate(payload, {
            onSuccess: () => {
                notify(`Attendance ${editingAttendance ? 'updated' : 'marked'} successfully`, 'success');
                onSave?.();
                onClose();
            },
            onError: (err: any) => notify(err.response?.data?.error || err.message || 'Operation failed', 'error'),
        });
    };

    const isLoading = markMutation.isPending || isLoadingStudents || isLoadingCourses;

    return (
        <form onSubmit={handleSubmit}>
            <DialogTitle>{editingAttendance ? 'Edit Attendance' : 'Mark Attendance'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ pt: 1 }}>
                    <Grid item xs={12}>
                        <TextField select label="Student" name="studentId" value={form.studentId} onChange={handleChange} fullWidth required>
                            {students.map((student: any) => (
                                <MenuItem key={student.id} value={student.id}>
                                    {student.user?.profile?.firstName} {student.user?.profile?.lastName} ({student.rollNumber})
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField select label="Course" name="courseId" value={form.courseId} onChange={handleChange} fullWidth required>
                            {courses.map((course: any) => (
                                <MenuItem key={course.id} value={course.id}>
                                    {course.name} ({course.code})
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField label="Date" name="date" type="date" value={form.date} onChange={handleChange} InputLabelProps={{ shrink: true }} fullWidth required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField select label="Status" name="status" value={form.status} onChange={handleChange} fullWidth required>
                            <MenuItem value="present">Present</MenuItem>
                            <MenuItem value="absent">Absent</MenuItem>
                            <MenuItem value="late">Late</MenuItem>
                        </TextField>
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
