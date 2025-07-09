import React from "react";
import { Typography, Paper } from "@mui/material";

export default function ProfessorSection() {
  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Professors
      </Typography>
      {/* Later, map professors from API */}
      <Typography>No professors yet.</Typography>
    </Paper>
  );
}
