import React, { useState, useEffect } from 'react';
import {
    DialogTitle, DialogContent, DialogActions, Button,
    TextField, Grid, CircularProgress
} from '@mui/material';
import { useNotify } from '../../../components/UI/NotificationProvider';
import { useCreateBranch, useUpdateBranch } from '../../../hooks/useBranches';
import { Branch, CreateBranchRequest } from '../../../types/api';
import { useAuthStore } from '@/stores/authStore';

interface BranchFormProps {
    editingBranch: Branch | null;
    onClose: () => void;
    onSave: () => void;
}

interface FormState extends Omit<CreateBranchRequest, 'institutionId'> { }

export default function BranchForm({ editingBranch, onClose, onSave }: BranchFormProps) {
    const user = useAuthStore((state) => state.user);
    const institutionId = user?.institutionId || '';

    const [form, setForm] = useState<FormState>({
        name: '',
        code: '',
        intakeCapacity: 0,
        establishedYear: new Date().getFullYear()
    });

    const notify = useNotify();

    useEffect(() => {
        if (editingBranch) {
            setForm({
                name: editingBranch.name || '',
                code: editingBranch.code || '',
                intakeCapacity: editingBranch.intakeCapacity || 0,
                establishedYear: editingBranch.establishedYear || new Date().getFullYear(),
            });
        } else {
            setForm({
                name: '',
                code: '',
                intakeCapacity: 0,
                establishedYear: new Date().getFullYear()
            });
        }
    }, [editingBranch]);

    const createMutation = useCreateBranch();
    const updateMutation = useUpdateBranch();
    const isLoading = createMutation.isPending || updateMutation.isPending;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'intakeCapacity' || name === 'establishedYear') {
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

        const payload: CreateBranchRequest = {
            ...form,
            institutionId,
        };

        if (editingBranch) {
            updateMutation.mutate({ id: editingBranch.id, data: payload }, {
                onSuccess: () => {
                    notify('Branch updated successfully', 'success');
                    onSave();
                },
                onError: (err: any) => notify(err.response?.data?.error || err.message || 'Update failed', 'error'),
            });
        } else {
            createMutation.mutate(payload, {
                onSuccess: () => {
                    notify('Branch created successfully', 'success');
                    onSave();
                },
                onError: (err: any) => notify(err.response?.data?.error || err.message || 'Creation failed', 'error'),
            });
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <DialogTitle>{editingBranch ? 'Edit Branch' : 'Add New Branch'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ pt: 1 }}>
                    <Grid item xs={12} sm={6}>
                        <TextField label="Branch Name" name="name" value={form.name} onChange={handleChange} fullWidth required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField label="Branch Code" name="code" value={form.code} onChange={handleChange} fullWidth required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField label="Intake Capacity" name="intakeCapacity" type="number" value={form.intakeCapacity} onChange={handleChange} fullWidth required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField label="Established Year" name="establishedYear" type="number" value={form.establishedYear} onChange={handleChange} fullWidth required />
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
