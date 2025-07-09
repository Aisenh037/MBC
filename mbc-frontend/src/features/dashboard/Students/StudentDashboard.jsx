import React from "react";
import { Typography, Paper } from "@mui/material";

export default function StudentSection() {
  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Students
      </Typography>
      {/* Later, map students from API */}
      <Typography>No students yet.</Typography>
    </Paper>
  );
}
