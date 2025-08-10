import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore"; // Assuming this path is correct for your structure
import {
  Button,
  TextField,
  Paper,
  Typography,
  Box,
  CircularProgress // Import CircularProgress for the loading indicator
} from "@mui/material";
import logo from '../assets/Manit_Logo_color_0-removebg-preview.png';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // Add a loading state

  // Get state and actions from your Zustand store
  const { login, user } = useAuthStore((state) => ({
    login: state.login,
    user: state.user,
  }));
  const navigate = useNavigate();

  // This effect handles redirection
  useEffect(() => {
    // If a user is already logged in, redirect them from the login page
    if (user) {
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "professor") navigate("/teacher");
      else if (user.role === "student") navigate("/student");
      else navigate("/"); // Fallback
    }
  }, [user, navigate]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    setLoading(true); // Set loading to true when the request starts
    try {
      await login({ email, password });
      // The useEffect hook will handle navigation on success
    } catch (err) {
      setError("Login failed. Please check your email and password.");
      console.error("Login failed:", err);
    } finally {
      setLoading(false); // Set loading to false when the request is complete
    }
  };

  return (
    <Box sx={{
      height: "100vh",
      background: "linear-gradient(to right, #e3f0ff, #f9fafb 80%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <Paper elevation={6} sx={{ p: 4, minWidth: 340, maxWidth: 360, borderRadius: 4 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <img src={logo} alt="Logo" width={56} style={{ margin: "8px 0" }} />

          <Typography component="h1" variant="h4" fontWeight="bold" gutterBottom>
            MANIT
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Welcome to MBC Portal
          </Typography>
        </Box>
        <Box component="form" sx={{ mt: 1 }} onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            fullWidth
            label="Email"
            autoFocus
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <TextField
            margin="normal"
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          
          {error && (
            <Typography color="error" align="center" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={loading} // Disable the button while loading
            sx={{ mt: 3, mb: 1, py: 1.5 }}
          >
            {/* Show spinner when loading, otherwise show text */}
            {loading ? <CircularProgress size={24} color="inherit" /> : "Login"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
