import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Button, CircularProgress, TextField, Typography } from "@mui/material";
import AuthLayout from "./AuthLayout";
import { useNotify } from "../../components/UI/NotificationProvider";
import { apiServices } from "../../services/apiServices";

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const notify = useNotify();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!token) {
            notify("Invalid reset token.", "error");
            return;
        }

        if (password !== confirmPassword) {
            notify("Passwords do not match.", "error");
            return;
        }

        setLoading(true);
        try {
            await apiServices.auth.resetPassword(token, password);
            notify("Password reset successfully! Please log in.", "success");
            navigate('/login');
        } catch (err: any) {
            notify(err.message || "Invalid or expired token.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title="Set New Password">
            <Box component="form" onSubmit={handleSubmit} noValidate>
                <TextField
                    label="New Password"
                    name="password"
                    type="password"
                    required
                    fullWidth
                    margin="normal"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    autoFocus
                />
                <TextField
                    label="Confirm New Password"
                    name="confirmPassword"
                    type="password"
                    required
                    fullWidth
                    margin="normal"
                    value={confirmPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                />
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    sx={{ mt: 3, mb: 2, py: 1.5 }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
                </Button>
            </Box>
        </AuthLayout>
    );
}
