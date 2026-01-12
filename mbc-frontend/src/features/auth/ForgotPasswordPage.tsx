import React, { useState } from "react";
import { Box, Button, CircularProgress, TextField, Typography, Link as MuiLink } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { useNotify } from "../../components/UI/NotificationProvider";
import { apiServices } from "../../services/apiServices";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const notify = useNotify();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        try {
            await apiServices.auth.forgotPassword(email);
            notify("If an account with that email exists, a reset link has been sent.", "success");
        } catch (err: any) {
            notify(err.message || "An error occurred.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title="Reset Password">
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
                Enter your email address and we will send you a link to reset your password.
            </Typography>
            <Box component="form" onSubmit={handleSubmit} noValidate>
                <TextField
                    label="Email Address"
                    name="email"
                    type="email"
                    required
                    fullWidth
                    margin="normal"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    autoComplete="email"
                    autoFocus
                />
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    sx={{ mt: 3, mb: 2, py: 1.5 }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
                </Button>
                <Typography variant="body2" align="center">
                    <MuiLink component={RouterLink} to="/login" variant="body2">
                        Back to Sign In
                    </MuiLink>
                </Typography>
            </Box>
        </AuthLayout>
    );
}
