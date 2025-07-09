import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate } from "react-router-dom";

export default function AdminHeader() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 2,
      }}
    >
      <Typography variant="h6">Welcome Admin</Typography>
      <Button variant="outlined" color="error" onClick={handleLogout}>
        Logout
      </Button>
    </Box>
  );
}
