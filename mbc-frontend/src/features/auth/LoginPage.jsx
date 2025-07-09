import { useState, useEffect } from "react";
import { useAuthStore } from "../../stores/authStore";
import { useNavigate } from "react-router-dom";
import { 
  Box,
  Button,
  CircularProgress,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const LoginPage = () => {
  // State management
  const { login, error, loading, clearError } = useAuthStore();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    email: "admin@mbc.manit.ac.in", // test value
    password: "",
    role: "admin", // Consider making 'role' dynamic based on your app's needs
    showPassword: false
  });

  // Clear errors on mount
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Handlers
  const handleChange = (prop) => (event) => {
    setFormData({ ...formData, [prop]: event.target.value });
  };

  const handleClickShowPassword = () => {
    setFormData({ ...formData, showPassword: !formData.showPassword });
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    clearError();

    try {
      await login({
        email: formData.email,
        password: formData.password,
        role: formData.role
      });

      // Role-based navigation
      const dashboardPaths = {
        admin: "/admin/dashboard",
        professor: "/professor/dashboard",
        student: "/student/dashboard"
      };

      navigate(dashboardPaths[formData.role] || "/");
    } catch (err) {
      console.error("Login error:", err);
      // Error state is already set by authStore
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        p: 3,
        backgroundColor: '#f5f5f5'
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: '100%',
          maxWidth: 400,
          p: 4,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 3
        }}
      >
        <Typography 
  variant="h4" 
  component="h1" 
  gutterBottom 
  sx={{ 
    textAlign: 'center', 
    mb: 4, 
  }}
>
  <span style={{ fontWeight: 'bold', color: '#1976d2' }}>Welcome to MBC Portal</span><br /><br />
  <span style={{ color: '#f50057' }}> Login</span>
</Typography>



        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error.message || 'An error occurred, please try again.'}
          </Typography>
        )}

        <TextField
          label="Email"
          type="email"
          required
          fullWidth
          margin="normal"
          value={formData.email}
          onChange={handleChange('email')}
          autoComplete="email"
          autoFocus
        />

        <TextField
          label="Password"
          type={formData.showPassword ? 'text' : 'password'}
          required
          fullWidth
          margin="normal"
          value={formData.password}
          onChange={handleChange('password')}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={handleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                  edge="end"
                >
                  {formData.showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <FormControl fullWidth margin="normal" required>
          <InputLabel>Role</InputLabel>
          <Select
            value={formData.role}
            label="Role"
            onChange={handleChange('role')}
          >
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="professor">Professor</MenuItem>
            <MenuItem value="student">Student</MenuItem>
          </Select>
        </FormControl>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          sx={{ mt: 3, mb: 2, py: 1.5 }}
        >
          {loading ? (
            <>
              <CircularProgress size={24} color="inherit" sx={{ mr: 2 }} />
              Logging in...
            </>
          ) : (
            'Login'
          )}
        </Button>
      </Box>
    </Box>
  );
};

export default LoginPage;
