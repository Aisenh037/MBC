// src/components/UI/StatCard.jsx
import { Paper, Avatar, Box, Typography, CircularProgress } from '@mui/material';
import { Link } from 'react-router-dom';

export default function StatCard({ item, loading }) {
  return (
    <Paper
      component={item.link ? Link : 'div'} // Allow card to not be a link
      to={item.link}
      elevation={2}
      sx={{
        p: 2.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '16px',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
      }}
    >
      <Box sx={{ textAlign: 'left' }}>
        <Typography variant="h4" fontWeight="bold" color="text.primary">
          {loading ? <CircularProgress size={28} color="inherit" /> : item.count}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {item.title}
        </Typography>
      </Box>
      <Avatar sx={{ bgcolor: item.color, width: 56, height: 56 }}>
        {item.icon}
      </Avatar>
    </Paper>
  );
}