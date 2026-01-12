import React, { useState, useEffect } from 'react';
import {
    DialogTitle, DialogContent, DialogActions, Button,
    TextField, Grid, CircularProgress, MenuItem,
    FormControlLabel, Switch
} from '@mui/material';
import { useNotify } from '../../../components/UI/NotificationProvider';
import { useAddCourse, useUpdateCourse } from '../../../hooks/useCourses';
import { useAdminBranches } from '../../../hooks/useBranches';
import { useAdminTeachers } from '../../../hooks/useTeachers';
import { useAuthStore } from '@/stores/authStore';
import { Course, CreateCourseRequest } from '../../../types/api';

interface CourseFormProps {
    editingCourse: Course | null;
    onClose: () => void;
    onSave: () => void;
}

interface FormState extends Omit<CreateCourseRequest, 'institutionId'> { }

export default function CourseForm({ editingCourse, onClose, onSave }: CourseFormProps) {
    const user = useAuthStore((state) => state.user);
    const institutionId = user?.institutionId || '';

    const [form, setForm] = useState<FormState>({
        name: '',
        code: '',
        description: '',
        credits: 3,
        semester: 1,
        branchId: '',
        professorId: '',
        isElective: false,
        maxStudents: 60,
        syllabus: '',
    });

    const notify = useNotify();

    const { data: branches = [], isLoading: isLoadingBranches } = useAdminBranches();
    const { data: professors = [], isLoading: isLoadingProfessors } = useAdminTeachers();
    const createMutation = useAddCourse();
    const updateMutation = useUpdateCourse();
    const isLoading = createMutation.isPending || updateMutation.isPending || isLoadingBranches || isLoadingProfessors;

    useEffect(() => {
        if (editingCourse) {
            setForm({
                name: editingCourse.name || '',
                code: editingCourse.code || '',
                description: editingCourse.description || '',
                credits: editingCourse.credits || 3,
                semester: editingCourse.semester || 1,
                branchId: editingCourse.branchId || '',
                professorId: (editingCourse as any).professorId || '', // Check if this field name is correct
                isElective: (editingCourse as any).isElective || false,
                maxStudents: (editingCourse as any).maxStudents || 60,
                syllabus: (editingCourse as any).syllabus || '',
            });
        }
    }, [editingCourse]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setForm({ ...form, [name]: checked });
        } else if (name === 'credits' || name === 'semester' || name === 'maxStudents') {
            setForm({ ...form, [name]: value === '' ? '' : Number(value) });
        } else {
            setForm({ ...form, [name]: value });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!institutionId) {
            notify('Institution ID missing. Please log in again.', 'error');
            return;
        }

        const payload: CreateCourseRequest = {
            ...form,
            institutionId,
        };

        if (editingCourse) {
            updateMutation.mutate({ id: editingCourse.id, data: payload }, {
                onSuccess: () => {
                    notify('Course updated successfully', 'success');
                    onSave();
                },
                onError: (err: any) => notify(err.response?.data?.error || err.message || 'Update failed', 'error'),
            });
        } else {
            createMutation.mutate(payload, {
                onSuccess: () => {
                    notify('Course created successfully', 'success');
                    onSave();
                },
                onError: (err: any) => notify(err.response?.data?.error || err.message || 'Creation failed', 'error'),
            });
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <DialogTitle>{editingCourse ? 'Edit Course' : 'Add New Course'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ pt: 1 }}>
                    <Grid item xs={12} sm={8}>
                        <TextField label="Course Name" name="name" value={form.name} onChange={handleChange} fullWidth required />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField label="Course Code" name="code" value={form.code} onChange={handleChange} fullWidth required />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            select
                            label="Branch"
                            name="branchId"
                            value={form.branchId}
                            onChange={handleChange}
                            fullWidth
                            required
                        >
                            {branches.map((b: any) => (
                                <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            select
                            label="Professor"
                            name="professorId"
                            value={form.professorId}
                            onChange={handleChange}
                            fullWidth
                            required
                        >
                            {professors.map((p: any) => (
                                <MenuItem key={p.id} value={p.id}>
                                    {p.user?.profile ? `${p.user.profile.firstName} ${p.user.profile.lastName}` : (p.user?.name || 'N/A')}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <TextField label="Semester" name="semester" type="number" inputProps={{ min: 1, max: 8 }} value={form.semester} onChange={handleChange} fullWidth required />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField label="Credits" name="credits" type="number" inputProps={{ min: 1, max: 10 }} value={form.credits} onChange={handleChange} fullWidth required />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField label="Max Students" name="maxStudents" type="number" value={form.maxStudents} onChange={handleChange} fullWidth />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField label="Description" name="description" value={form.description} onChange={handleChange} fullWidth multiline rows={2} />
                    </Grid>

                    <Grid item xs={12}>
                        <FormControlLabel
                            control={<Switch checked={!!form.isElective} onChange={handleChange} name="isElective" color="primary" />}
                            label="Is Elective?"
                        />
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
