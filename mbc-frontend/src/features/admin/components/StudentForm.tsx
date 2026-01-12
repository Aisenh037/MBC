import React, { useState, useEffect } from 'react';
import {
    DialogTitle, DialogContent, DialogActions, Button,
    TextField, Grid, CircularProgress, Select, MenuItem,
    InputLabel, FormControl, SelectChangeEvent
} from '@mui/material';
import { useNotify } from '../../../components/UI/NotificationProvider';
import { useAddStudent, useUpdateStudent } from '../../../hooks/useStudents';
import { useAdminBranches } from '../../../hooks/useBranches';
import { useAuthStore } from '@/stores/authStore';
import { Student, CreateStudentRequest } from '../../../types/api';

const departments = ["MBC", "CSE", "ECE", "EE", "MANS"];

interface StudentFormProps {
    editingStudent: Student | null;
    onClose: () => void;
    onSave: () => void;
    viewMode?: boolean;
}

interface FormState extends Omit<CreateStudentRequest, 'institutionId'> {
    password?: string;
    department: string;
}

export default function StudentForm({ editingStudent, onClose, onSave, viewMode = false }: StudentFormProps) {
    const user = useAuthStore((state) => state.user);
    const institutionId = user?.institutionId || '';

    const [form, setForm] = useState<FormState>({
        name: '',
        email: '',
        password: '',
        rollNumber: '',
        phoneNumber: '',
        semester: 1,
        branchId: '',
        department: 'MBC',
        academicYear: new Date().getFullYear().toString(),
    });

    const notify = useNotify();
    const { data: branches = [], isLoading: isLoadingBranches } = useAdminBranches();
    const addMutation = useAddStudent();
    const updateMutation = useUpdateStudent();
    const isLoading = addMutation.isPending || updateMutation.isPending || isLoadingBranches;

    useEffect(() => {
        if (editingStudent) {
            setForm({
                name: editingStudent.user?.profile
                    ? `${editingStudent.user.profile.firstName} ${editingStudent.user.profile.lastName}`
                    : '',
                email: editingStudent.user?.email || '',
                rollNumber: editingStudent.rollNumber || '',
                phoneNumber: editingStudent.phoneNumber || '',
                semester: editingStudent.semester ?? 1,
                branchId: editingStudent.branchId || '',
                department: 'MBC', // Defaulting as it's not in the new student type
                academicYear: editingStudent.academicYear || new Date().getFullYear().toString(),
                password: '',
            });
        }
    }, [editingStudent]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
        const { name, value } = e.target;
        if (name === 'semester') {
            setForm((f) => ({ ...f, [name]: value === '' ? '' : Number(value) } as any));
        } else {
            setForm((f) => ({ ...f, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!institutionId) {
            notify('Institution ID missing. Please log in again.', 'error');
            return;
        }

        const payload: CreateStudentRequest = {
            ...form,
            institutionId,
        };

        if (editingStudent) {
            // In update, we don't send password if empty
            const updatePayload = { ...payload };
            if (!form.password) {
                delete (updatePayload as any).password;
            }

            updateMutation.mutate({ id: editingStudent.id, data: updatePayload as any }, {
                onSuccess: () => {
                    notify('Student updated successfully', 'success');
                    onSave();
                },
                onError: (err: any) => {
                    notify(err?.response?.data?.error || err?.message || 'Update failed', 'error');
                },
            });
        } else {
            addMutation.mutate(payload, {
                onSuccess: () => {
                    notify('Student added successfully', 'success');
                    onSave();
                },
                onError: (err: any) => {
                    notify(err?.response?.data?.error || err?.message || 'Addition failed', 'error');
                },
            });
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <DialogTitle>{viewMode ? 'View Student' : (editingStudent ? 'Edit Student' : 'Add New Student')}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ pt: 1 }}>
                    <Grid item xs={12}>
                        <TextField
                            label="Full Name"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            fullWidth
                            required
                            disabled={viewMode}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            label="Email"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            fullWidth
                            required
                            disabled={viewMode}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Roll Number"
                            name="rollNumber"
                            value={form.rollNumber}
                            onChange={handleChange}
                            fullWidth
                            required
                            disabled={viewMode}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Phone Number"
                            name="phoneNumber"
                            value={form.phoneNumber}
                            onChange={handleChange}
                            fullWidth
                            inputProps={{ maxLength: 10 }}
                            disabled={viewMode}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Semester"
                            name="semester"
                            type="number"
                            inputProps={{ min: 1, max: 8 }}
                            value={form.semester}
                            onChange={handleChange}
                            fullWidth
                            required
                            disabled={viewMode}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Academic Year"
                            name="academicYear"
                            value={form.academicYear}
                            onChange={handleChange}
                            fullWidth
                            required
                            disabled={viewMode}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth required disabled={viewMode}>
                            <InputLabel>Branch</InputLabel>
                            <Select
                                name="branchId"
                                value={form.branchId}
                                label="Branch"
                                onChange={handleChange as any}
                            >
                                {isLoadingBranches ? <MenuItem disabled>Loading...</MenuItem> :
                                    branches.map((b: any) => (<MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {!editingStudent && !viewMode && (
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
                <Button onClick={onClose} disabled={isLoading}>
                    {viewMode ? 'Close' : 'Cancel'}
                </Button>
                {!viewMode && (
                    <Button type="submit" variant="contained" disabled={isLoading}>
                        {isLoading ? <CircularProgress size={24} /> : 'Save'}
                    </Button>
                )}
            </DialogActions>
        </form>
    );
}
