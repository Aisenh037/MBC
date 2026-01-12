// src/components/UI/StatCard.tsx
import React from 'react';
import { Card, CardActionArea, CardContent, Typography, Box, CircularProgress, alpha } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface StatCardItem {
  title: string;
  count?: number;
  icon: React.ReactElement;
  color: string;
  link?: string;
}

interface StatCardProps {
  item: StatCardItem;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ item, loading = false }) => {
  const navigate = useNavigate();

  const handleCardClick = (): void => {
    if (item.link) {
      navigate(item.link);
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        // Use a theme callback to resolve the color first
        backgroundColor: (theme) => {
          // Fallback to a default color if item.color is not a valid theme color
          const colorPath = item.color.split('.');
          const paletteSection = theme.palette[colorPath[0] as keyof typeof theme.palette];
          const colorValue = (paletteSection && typeof paletteSection === 'object' && colorPath[1] && colorPath[1] in paletteSection) 
            ? (paletteSection as any)[colorPath[1]] 
            : theme.palette.grey[200];
          return alpha(colorValue, 0.15); // Increased alpha slightly for better visibility
        },
      }}
    >
      <CardActionArea onClick={handleCardClick} sx={{ height: '100%', p: 2 }}>
        <CardContent sx={{ textAlign: 'center' }}>
          {loading ? (
            <CircularProgress sx={{ color: item.color }} />
          ) : (
            <>
              <Box sx={{ color: item.color, mb: 1 }}>
                {React.cloneElement(item.icon as React.ReactElement<any>, { style: { fontSize: 40 } })}
              </Box>
              <Typography variant="h4" component="div" fontWeight="bold">
                {item.count ?? 0}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                {item.title}
              </Typography>
            </>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default StatCard;