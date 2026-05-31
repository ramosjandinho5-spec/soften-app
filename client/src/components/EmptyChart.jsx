import React from 'react';
import { Box, Typography } from '@mui/material';
import { BarChart as BarChartIcon } from '@mui/icons-material';

const EmptyChart = ({ message = 'Sem dados para exibir.' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        color: 'text.secondary',
      }}
    >
      <BarChartIcon sx={{ fontSize: 60, mb: 2, color: 'primary.main', opacity: 0.6 }} />
      <Typography variant="body1">{message}</Typography>
    </Box>
  );
};

export default EmptyChart;