import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Grid,
    TextField,
    Button,
    Avatar,
    Box,
    Alert,
    Tabs,
    Tab,
    Card,
    CardContent,
    Divider,
    Switch,
    FormControlLabel,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PhotoCamera, Save, Cancel, Edit } from '@mui/icons-material';
import { useAuthStore } from '../stores/authStore';
import apiClient from '../services/apiClient';

interface ProfileData {
    name: string;
    email: string;
    role: string;
    avatar?: string;
    bio?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    // Student specifics
    enrollmentNumber?: string;
    branch?: string;
    semester?: number | string;
    yearOfAdmission?: number | string;
    // Professor specifics
    department?: string;
    designation?: string;
    specialization?: string;
    experience?: number | string;
}

const Profile = () => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState(0);
    const [editMode, setEditMode] = useState(false);
    const [passwordDialog, setPasswordDialog] = useState(false);

    const [formData, setFormData] = useState<ProfileData>({
        name: '',
        email: '',
        role: '',
        bio: '',
        phone: '',
        dateOfBirth: '',
        gender: 'prefer-not-to-say',
        enrollmentNumber: '',
        branch: '',
        semester: '',
        yearOfAdmission: '',
        department: '',
        designation: '',
        specialization: '',
        experience: '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [preferences, setPreferences] = useState({
        theme: 'auto',
        notifications: {
            email: true,
            push: true,
            sms: false,
        },
        language: 'en',
    });

    // Fetch profile data
    const { data: profile, isLoading, error } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const response = await apiClient.get('/profile');
            return response.data.data;
        },
    });

    // Fetch preferences
    const { data: userPreferences } = useQuery({
        queryKey: ['preferences'],
        queryFn: async () => {
            const response = await apiClient.get('/profile/preferences');
            return response.data.data;
        },
    });

    // Update profile mutation
    const updateProfileMutation = useMutation({
        mutationFn: async (data: Partial<ProfileData>) => {
            const response = await apiClient.put('/profile', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            setEditMode(false);
        },
    });

    // Change password mutation
    const changePasswordMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await apiClient.put('/profile/change-password', data);
            return response.data;
        },
        onSuccess: () => {
            setPasswordDialog(false);
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        },
    });

    // Update preferences mutation
    const updatePreferencesMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await apiClient.put('/profile/preferences', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['preferences'] });
        },
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                name: profile.name || '',
                email: profile.email || '',
                role: profile.role || '',
                bio: profile.bio || '',
                phone: profile.phone || '',
                dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
                gender: profile.gender || 'prefer-not-to-say',
                enrollmentNumber: profile.enrollmentNumber || '',
                branch: profile.branch || '',
                semester: profile.semester || '',
                yearOfAdmission: profile.yearOfAdmission || '',
                department: profile.department || '',
                designation: profile.designation || '',
                specialization: profile.specialization || '',
                experience: profile.experience || '',
                avatar: profile.avatar || '',
            });
        }
    }, [profile]);

    useEffect(() => {
        if (userPreferences) {
            setPreferences(userPreferences);
        }
    }, [userPreferences]);

    const handleInputChange = (field: keyof ProfileData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handlePreferenceChange = (field: string, value: any) => {
        setPreferences(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleNotificationChange = (type: string, value: boolean) => {
        setPreferences(prev => ({
            ...prev,
            notifications: {
                ...prev.notifications,
                [type]: value,
            },
        }));
    };

    const handleSaveProfile = () => {
        updateProfileMutation.mutate(formData);
    };

    const handleSavePreferences = () => {
        updatePreferencesMutation.mutate(preferences);
    };

    const handleChangePassword = () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('New passwords do not match');
            return;
        }
        changePasswordMutation.mutate({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
        });
    };

    if (isLoading) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Typography>Loading profile...</Typography>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="error">Error loading profile: {(error as Error).message}</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                Profile Management
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                    <Tab label="Personal Information" />
                    <Tab label="Academic/Professional" />
                    <Tab label="Preferences" />
                    <Tab label="Security" />
                </Tabs>
            </Box>

            {/* Personal Information Tab */}
            {activeTab === 0 && (
                <Card>
                    <CardContent>
                        <Box display="flex" alignItems="center" mb={3}>
                            <Avatar
                                src={profile?.avatar}
                                sx={{ width: 80, height: 80, mr: 2 }}
                            >
                                {formData.name?.charAt(0)?.toUpperCase()}
                            </Avatar>
                            <Box>
                                <Typography variant="h6">{formData.name}</Typography>
                                <Typography color="textSecondary">{formData.email}</Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {formData.role?.charAt(0).toUpperCase() + formData.role?.slice(1)}
                                </Typography>
                            </Box>
                            <Box ml="auto">
                                <IconButton onClick={() => setEditMode(!editMode)}>
                                    <Edit />
                                </IconButton>
                            </Box>
                        </Box>

                        <Divider sx={{ mb: 3 }} />

                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Full Name"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    disabled={!editMode}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth disabled={!editMode}>
                                    <InputLabel>Gender</InputLabel>
                                    <Select
                                        value={formData.gender}
                                        onChange={(e) => handleInputChange('gender', e.target.value)}
                                        label="Gender"
                                    >
                                        <MenuItem value="male">Male</MenuItem>
                                        <MenuItem value="female">Female</MenuItem>
                                        <MenuItem value="other">Other</MenuItem>
                                        <MenuItem value="prefer-not-to-say">Prefer not to say</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Phone"
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    disabled={!editMode}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Date of Birth"
                                    type="date"
                                    value={formData.dateOfBirth}
                                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                    disabled={!editMode}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Bio"
                                    multiline
                                    rows={3}
                                    value={formData.bio}
                                    onChange={(e) => handleInputChange('bio', e.target.value)}
                                    disabled={!editMode}
                                    placeholder="Tell us about yourself..."
                                />
                            </Grid>
                        </Grid>

                        {editMode && (
                            <Box mt={3} display="flex" gap={2}>
                                <Button
                                    variant="contained"
                                    startIcon={<Save />}
                                    onClick={handleSaveProfile}
                                    disabled={updateProfileMutation.isPending}
                                >
                                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<Cancel />}
                                    onClick={() => setEditMode(false)}
                                >
                                    Cancel
                                </Button>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Academic/Professional Tab */}
            {activeTab === 1 && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            {user?.role === 'student' ? 'Academic Information' : 'Professional Information'}
                        </Typography>

                        <Grid container spacing={3}>
                            {user?.role === 'student' && (
                                <>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Enrollment Number"
                                            value={formData.enrollmentNumber}
                                            onChange={(e) => handleInputChange('enrollmentNumber', e.target.value)}
                                            disabled={!editMode}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Branch"
                                            value={formData.branch}
                                            onChange={(e) => handleInputChange('branch', e.target.value)}
                                            disabled={!editMode}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Semester"
                                            type="number"
                                            value={formData.semester}
                                            onChange={(e) => handleInputChange('semester', e.target.value)}
                                            disabled={!editMode}
                                            inputProps={{ min: 1, max: 8 }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Year of Admission"
                                            type="number"
                                            value={formData.yearOfAdmission}
                                            onChange={(e) => handleInputChange('yearOfAdmission', e.target.value)}
                                            disabled={!editMode}
                                        />
                                    </Grid>
                                </>
                            )}

                            {user?.role === 'professor' && (
                                <>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Department"
                                            value={formData.department}
                                            onChange={(e) => handleInputChange('department', e.target.value)}
                                            disabled={!editMode}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Designation"
                                            value={formData.designation}
                                            onChange={(e) => handleInputChange('designation', e.target.value)}
                                            disabled={!editMode}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Specialization"
                                            value={formData.specialization}
                                            onChange={(e) => handleInputChange('specialization', e.target.value)}
                                            disabled={!editMode}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Experience (years)"
                                            type="number"
                                            value={formData.experience}
                                            onChange={(e) => handleInputChange('experience', e.target.value)}
                                            disabled={!editMode}
                                            inputProps={{ min: 0 }}
                                        />
                                    </Grid>
                                </>
                            )}
                        </Grid>
                    </CardContent>
                </Card>
            )}

            {/* Preferences Tab */}
            {activeTab === 2 && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Preferences
                        </Typography>

                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Theme</InputLabel>
                                    <Select
                                        value={preferences.theme}
                                        onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                                        label="Theme"
                                    >
                                        <MenuItem value="light">Light</MenuItem>
                                        <MenuItem value="dark">Dark</MenuItem>
                                        <MenuItem value="auto">Auto</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Language</InputLabel>
                                    <Select
                                        value={preferences.language}
                                        onChange={(e) => handlePreferenceChange('language', e.target.value)}
                                        label="Language"
                                    >
                                        <MenuItem value="en">English</MenuItem>
                                        <MenuItem value="hi">Hindi</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>
                                    Notification Preferences
                                </Typography>
                                <Box display="flex" flexDirection="column" gap={1}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={preferences.notifications.email}
                                                onChange={(e) => handleNotificationChange('email', e.target.checked)}
                                            />
                                        }
                                        label="Email Notifications"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={preferences.notifications.push}
                                                onChange={(e) => handleNotificationChange('push', e.target.checked)}
                                            />
                                        }
                                        label="Push Notifications"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={preferences.notifications.sms}
                                                onChange={(e) => handleNotificationChange('sms', e.target.checked)}
                                            />
                                        }
                                        label="SMS Notifications"
                                    />
                                </Box>
                            </Grid>
                        </Grid>

                        <Box mt={3}>
                            <Button
                                variant="contained"
                                onClick={handleSavePreferences}
                                disabled={updatePreferencesMutation.isPending}
                            >
                                {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Preferences'}
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            )}

            {/* Security Tab */}
            {activeTab === 3 && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Security Settings
                        </Typography>

                        <Box mb={3}>
                            <Typography variant="body1" gutterBottom>
                                Change Password
                            </Typography>
                            <Button
                                variant="outlined"
                                onClick={() => setPasswordDialog(true)}
                            >
                                Change Password
                            </Button>
                        </Box>

                        <Divider sx={{ my: 3 }} />

                        <Box>
                            <Typography variant="body1" color="error" gutterBottom>
                                Danger Zone
                            </Typography>
                            <Typography variant="body2" color="textSecondary" mb={2}>
                                Once you delete your account, there is no going back. Please be certain.
                            </Typography>
                            <Button variant="outlined" color="error">
                                Delete Account
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            )}

            {/* Password Change Dialog */}
            <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)}>
                <DialogTitle>Change Password</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Current Password"
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData(prev => ({
                                    ...prev,
                                    currentPassword: e.target.value
                                }))}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="New Password"
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData(prev => ({
                                    ...prev,
                                    newPassword: e.target.value
                                }))}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Confirm New Password"
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData(prev => ({
                                    ...prev,
                                    confirmPassword: e.target.value
                                }))}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPasswordDialog(false)}>Cancel</Button>
                    <Button
                        onClick={handleChangePassword}
                        disabled={changePasswordMutation.isPending}
                    >
                        {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Success/Error Messages */}
            {updateProfileMutation.isSuccess && (
                <Alert severity="success" sx={{ mt: 2 }}>
                    Profile updated successfully!
                </Alert>
            )}
            {updateProfileMutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    Error updating profile: {(updateProfileMutation.error as Error)?.message}
                </Alert>
            )}
            {changePasswordMutation.isSuccess && (
                <Alert severity="success" sx={{ mt: 2 }}>
                    Password changed successfully!
                </Alert>
            )}
            {changePasswordMutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    Error changing password: {(changePasswordMutation.error as Error)?.message}
                </Alert>
            )}
        </Container>
    );
};

export default Profile;
