// src/features/admin/dashboard/admin/AdminDashboard.jsx
import React from 'react';
import { Grid, Typography } from '@mui/material';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import CoPresentIcon from '@mui/icons-material/CoPresent';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import CampaignIcon from '@mui/icons-material/Campaign';
import StatCard from '../../../components/UI/StatCard';
import { useAnalytics } from '@/hooks/useAnalytics';
export default function AdminDashboard() {
  const { data: stats, isLoading } = useAnalytics();

  const dashboardItems = [
    { title: 'Students', count: stats?.totalStudents, icon: <PeopleOutlineIcon />, color: 'primary.main', link: '/admin/students' },
    { title: 'Teachers', count: stats?.totalTeachers, icon: <CoPresentIcon />, color: 'success.main', link: '/admin/teachers' },
    { title: 'Branches', count: stats?.totalBranches, icon: <AccountTreeIcon />, color: 'secondary.main', link: '/admin/branches' },
    { title: 'Notices', count: stats?.totalNotices, icon: <CampaignIcon />, color: 'warning.main', link: '/admin/notices' },
  ];

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Dashboard Overview
      </Typography>
      <Grid container spacing={3}>
        {dashboardItems.map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item.title}>
            <StatCard item={item} loading={isLoading} />
          </Grid>
        ))}
      </Grid>
    </>
  );
}