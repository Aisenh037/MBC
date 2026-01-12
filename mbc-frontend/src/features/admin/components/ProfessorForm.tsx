import React, { useState, useEffect } from 'react';
import {
    DialogTitle, DialogContent, DialogActions, Button,
    TextField, Grid, CircularProgress, Autocomplete, Chip
} from '@mui/material';
import { useNotify } from '@/components/UI/NotificationProvider';
import { useAddTeacher, useUpdateTeacher } from '@/hooks/useTeachers';
import { useAdminBranches } from '@/hooks/useBranches';
import { useAuthStore } from '@/stores/authStore';
import { Professor, CreateProfessorRequest, Branch } from '@/types/api';

interface ProfessorFormProps {
    editingTeacher: Professor | null;
    onClose: () => void;
    onSave: () => void;
}

interface FormState extends Omit<CreateProfessorRequest, 'institutionId' | 'branchIds'> {
    password?: string;
}

export default function ProfessorForm({ editingTeacher, onClose, onSave }: ProfessorFormProps) {
    const user = useAuthStore((state) => state.user);
    const institutionId = user?.institutionId || '';

    const [form, setForm] = useState<FormState>({
        name: '',
        email: '',
        password: '',
        employeeId: '',
        phoneNumber: '',
        department: '',
        designation: '',
    });

    const [selectedBranches, setSelectedBranches] = useState<Branch[]>([]);
    const notify = useNotify();

    const { data: allBranches = [], isLoading: isLoadingBranches } = useAdminBranches();
    const addMutation = useAddTeacher();
    const updateMutation = useUpdateTeacher();
    const isLoading = addMutation.isPending || updateMutation.isPending || isLoadingBranches;

    useEffect(() => {
        if (editingTeacher) {
            setForm({
                name: editingTeacher.user?.profile
                    ? `${editingTeacher.user.profile.firstName} ${editingTeacher.user.profile.lastName}`
                    : (editingTeacher.user?.name || ''),
                email: editingTeacher.user?.email || '',
                employeeId: editingTeacher.employeeId || '',
                phoneNumber: editingTeacher.phoneNumber || '',
                department: editingTeacher.department || '',
                designation: editingTeacher.designation || '',
                password: '',
            });

            if (editingTeacher.branches) {
                // Map backend branches structure to Branch[]
                const currentBranches = (editingTeacher.branches as any[]).map(b => b.branch).filter(Boolean);
                setSelectedBranches(currentBranches);
            }
        } else {
            setForm({
                name: '',
                email: '',
                password: '',
                employeeId: '',
                phoneNumber: '',
                department: '',
                designation: '',
            });
            setSelectedBranches([]);
        }
    }, [editingTeacher, allBranches]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!institutionId) {
            notify('Institution ID missing. Please log in again.', 'error');
            return;
        }

        if (selectedBranches.length === 0) {
            notify('Please select at least one branch', 'error');
            return;
        }

        const payload: CreateProfessorRequest = {
            ...form,
            branchIds: selectedBranches.map(b => b.id),
            institutionId,
        };

        if (editingTeacher) {
            if (!form.password) delete (payload as any).password;

            updateMutation.mutate({ id: editingTeacher.id, data: payload as any }, {
                onSuccess: () => {
                    notify('Professor updated successfully', 'success');
                    onSave();
                },
                onError: (err: any) => notify(err.response?.data?.error || err.message || 'Update failed', 'error'),
            });
        } else {
            addMutation.mutate(payload, {
                onSuccess: () => {
                    notify('Professor added successfully', 'success');
                    onSave();
                },
                onError: (err: any) => notify(err.response?.data?.error || err.message || 'Addition failed', 'error'),
            });
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <DialogTitle>{editingTeacher ? 'Edit Professor' : 'Add New Professor'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ pt: 1 }}>
                    <Grid item xs={12}>
                        <TextField label="Full Name" name="name" value={form.name} onChange={handleChange} fullWidth required />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField label="Email" name="email" type="email" value={form.email} onChange={handleChange} fullWidth required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField label="Employee ID" name="employeeId" value={form.employeeId} onChange={handleChange} fullWidth required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField label="Mobile" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField label="Department" name="department" value={form.department} onChange={handleChange} fullWidth required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField label="Designation" name="designation" value={form.designation} onChange={handleChange} fullWidth required />
                    </Grid>
                    <Grid item xs={12}>
                        <Autocomplete
                            multiple
                            options={allBranches as Branch[]}
                            getOptionLabel={(option) => option.name}
                            value={selectedBranches}
                            onChange={(_, newValue) => setSelectedBranches(newValue)}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                    <Chip variant="outlined" label={option.name} {...getTagProps({ index })} key={option.id} />
                                ))
                            }
                            renderInput={(params) => (
                                <TextField {...params} variant="outlined" label="Authorized Branches" placeholder="Select Branches" required={selectedBranches.length === 0} />
                            )}
                        />
                    </Grid>
                    {!editingTeacher && (
                        <Grid item xs={12}>
                            <TextField label="Password" name="password" type="password" value={form.password} onChange={handleChange} fullWidth required />
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
