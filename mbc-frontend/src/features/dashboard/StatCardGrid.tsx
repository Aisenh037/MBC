// src/features/admin/dashboard/components/StatCardGrid.tsx
import React from 'react';
import { Grid } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import GroupIcon from '@mui/icons-material/Group';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ClassIcon from '@mui/icons-material/Class';
import StatCard from '../../components/UI/StatCard';
import { AnalyticsData } from '@/types/api';

interface StatCardGridProps {
  stats: AnalyticsData;
}

export default function StatCardGrid({ stats }: StatCardGridProps): React.JSX.Element {
  const cards = [
    { title: "Total Students", count: stats?.totalStudents || 0, icon: <GroupIcon />, color: 'primary.main', link: '/admin/students' },
    { title: "Total Professors", count: stats?.totalProfessors || (stats as any)?.totalTeachers || 0, icon: <SchoolIcon />, color: 'success.main', link: '/admin/teachers' },
    { title: "Total Assignments", count: stats?.totalAssignments || 0, icon: <AssignmentIcon />, color: 'secondary.main' },
    { title: "Total Classes", count: stats?.totalCourses || stats?.enrolledCourses || 0, icon: <ClassIcon />, color: 'warning.main' },
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {cards.map((item) => (
        <Grid item xs={12} sm={6} md={3} key={item.title}>
          <StatCard item={item} />
        </Grid>
      ))}
    </Grid>
  );
}