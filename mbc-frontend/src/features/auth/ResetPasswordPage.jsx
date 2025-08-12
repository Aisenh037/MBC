import { useState } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import { Box, Button, CircularProgress, TextField, Typography, Link as MuiLink } from "@mui/material";
import AuthLayout from "./AuthLayout";
import { useNotify } from "../../components/UI/NotificationProvider";
import apiClient from "../../services/apiClient";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();
  const notify = useNotify();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      notify("Passwords do not match.", "error");
      return;
    }
    setLoading(true);
    try {
      await apiClient.put(`/auth/reset-password/${token}`, { password });
      notify("Password reset successfully! Please log in.", "success");
      navigate('/login');
    } catch (err) {
      notify(err.response?.data?.error || "Invalid or expired token.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Set New Password">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          label="New Password" name="password" type="password" required fullWidth margin="normal"
          value={password} onChange={(e) => setPassword(e.target.value)} autoFocus
        />
        <TextField
          label="Confirm New Password" name="confirmPassword" type="password" required fullWidth margin="normal"
          value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{ mt: 3, mb: 2, py: 1.5 }}>
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
        </Button>
      </Box>
    </AuthLayout>
  );
}