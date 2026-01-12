import React, { useState, useEffect } from 'react';
import {
    DialogTitle, DialogContent, DialogActions, Button, TextField,
    Grid, CircularProgress, Select, MenuItem, InputLabel, FormControl,
    SelectChangeEvent
} from '@mui/material';
import { useNotify } from '../../../components/UI/NotificationProvider';
import { useCreateNotice, useUpdateNotice } from '../../../hooks/useNotices';
import { useAdminBranches } from '../../../hooks/useBranches';
import { Notice, CreateNoticeRequest } from '../../../types/api';

interface NoticeFormProps {
    editingNotice: Notice | null;
    onClose: () => void;
    onSave?: () => void;
}

interface FormState {
    title: string;
    content: string;
    targetType: 'all' | 'students' | 'teachers' | 'branch';
    branchId: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
}

export default function NoticeForm({ editingNotice, onClose, onSave }: NoticeFormProps) {
    const [form, setForm] = useState<FormState>({
        title: '',
        content: '',
        targetType: 'all',
        branchId: '',
        priority: 'normal'
    });

    const notify = useNotify();
    const { data: branches = [], isLoading: isLoadingBranches } = useAdminBranches();

    useEffect(() => {
        if (editingNotice) {
            let targetType: FormState['targetType'] = 'all';
            let branchId = '';

            const audience = editingNotice.targetAudience || [];
            if (audience.includes('all')) {
                targetType = 'all';
            } else if (audience.some(a => a.startsWith('role:student'))) {
                targetType = 'students';
            } else if (audience.some(a => a.startsWith('role:professor'))) {
                targetType = 'teachers';
            } else {
                const branchTarget = audience.find(a => a.startsWith('branch:'));
                if (branchTarget) {
                    targetType = 'branch';
                    branchId = branchTarget.split(':')[1];
                }
            }

            setForm({
                title: editingNotice.title || '',
                content: editingNotice.content || '',
                targetType,
                branchId,
                priority: editingNotice.priority || 'normal',
            });
        } else {
            setForm({ title: '', content: '', targetType: 'all', branchId: '', priority: 'normal' });
        }
    }, [editingNotice]);

    const createMutation = useCreateNotice();
    const updateMutation = useUpdateNotice();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Construct targetAudience based on targetType and branchId
        let targetAudience: string[] = ['all'];
        if (form.targetType === 'students') targetAudience = ['role:student'];
        else if (form.targetType === 'teachers') targetAudience = ['role:professor'];
        else if (form.targetType === 'branch' && form.branchId) {
            targetAudience = [`branch:${form.branchId}`];
        }

        const payload: CreateNoticeRequest = {
            title: form.title,
            content: form.content,
            targetAudience,
            priority: form.priority,
        };

        if (editingNotice) {
            updateMutation.mutate({ id: editingNotice.id, data: payload }, {
                onSuccess: () => {
                    notify('Notice updated successfully', 'success');
                    onSave?.();
                    onClose();
                },
                onError: (err: any) => notify(err.response?.data?.error || err.message || 'Update failed', 'error'),
            });
        } else {
            createMutation.mutate(payload, {
                onSuccess: () => {
                    notify('Notice created successfully', 'success');
                    onSave?.();
                    onClose();
                },
                onError: (err: any) => notify(err.response?.data?.error || err.message || 'Creation failed', 'error'),
            });
        }
    };

    const isLoading = createMutation.isPending || updateMutation.isPending || isLoadingBranches;

    return (
        <form onSubmit={handleSubmit}>
            <DialogTitle>{editingNotice ? 'Edit Notice' : 'Create New Notice'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ pt: 1 }}>
                    <Grid item xs={12}>
                        <TextField label="Title" name="title" value={form.title} onChange={handleChange} fullWidth required />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField label="Content" name="content" value={form.content} onChange={handleChange} fullWidth multiline rows={4} required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth required>
                            <InputLabel>Target Audience</InputLabel>
                            <Select name="targetType" value={form.targetType} label="Target Audience" onChange={handleChange}>
                                <MenuItem value="all">Everyone</MenuItem>
                                <MenuItem value="students">All Students</MenuItem>
                                <MenuItem value="teachers">All Professors</MenuItem>
                                <MenuItem value="branch">Specific Branch</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth required>
                            <InputLabel>Priority</InputLabel>
                            <Select name="priority" value={form.priority} label="Priority" onChange={handleChange}>
                                <MenuItem value="low">Low</MenuItem>
                                <MenuItem value="normal">Normal</MenuItem>
                                <MenuItem value="high">High</MenuItem>
                                <MenuItem value="urgent">Urgent</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    {form.targetType === 'branch' && (
                        <Grid item xs={12}>
                            <FormControl fullWidth required>
                                <InputLabel>Select Branch</InputLabel>
                                <Select name="branchId" value={form.branchId} label="Select Branch" onChange={handleChange}>
                                    {branches.map((b: any) => (
                                        <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                                    ))}
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
