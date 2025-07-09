import React from "react";
import { Box, Typography, Divider, Grid, Paper, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AdminSidebar />
      <Box sx={{ flex: 1, p: 3 }}>
        <AdminHeader />
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="h6" gutterBottom>
                👨‍🏫 Manage Professors
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Add, edit, and manage professors.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate("/admin/professors")}
              >
                Go to Professor Section
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="h6" gutterBottom>
                🎓 Manage Students
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Enroll, edit, and track student records.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate("/admin/students")}
              >
                Go to Student Section
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="h6" gutterBottom>
                🏛️ Manage Branches / Classes
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Define and update academic branches and class groups.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate("/admin/branches")}
              >
                Go to Branch Section
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
