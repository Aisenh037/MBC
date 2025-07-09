import React from "react";
import { Box, Typography } from "@mui/material";
import LoginPage from "@/features/auth/LoginPage"; // 👈 import the component, don't route

export default function LandingPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        px: 2,
      }}
    >
      {/* 🏫 Hero / Branding Section */}
      <Typography variant="h3" gutterBottom>
        Welcome to MBC Department Portal
      </Typography>

      <Typography variant="body1" gutterBottom>
        Please login to continue based on your role.
      </Typography>

      {/* 🔐 Login Section */}
      <Box sx={{ width: "100%", maxWidth: 500, mt: 4 }}>
        <LoginPage />
      </Box>
    </Box>
  );
}
