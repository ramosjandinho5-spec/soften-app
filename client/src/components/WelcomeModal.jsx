import React from 'react';
import { Dialog, DialogContent, Typography, Button, Box } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { keyframes } from '@emotion/react';

// Keyframes for animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const WelcomeModal = ({ open, onClose }) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: '24px',
          background: 'linear-gradient(145deg, #ffffff, #f3e5f5)', // Light blue to light purple gradient
          animation: `${fadeIn} 0.5s ease-out`,
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        }
      }}
    >
      <DialogContent sx={{ textAlign: 'center', padding: '40px 30px' }}>
        <Box sx={{ color: 'success.main', mb: 2 }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 70 }} />
        </Box>
        <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', mb: 2, color: '#10466b' }}>
          Bem-vindo à OrganizaÊ!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Sua jornada para uma gestão eficiente começa agora. Estamos felizes em ter você a bordo.
        </Typography>
        <Button 
          onClick={onClose} 
          variant="contained" 
          size="large"
          fullWidth
          sx={{
            borderRadius: '12px',
            padding: '12px 0',
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'scale(1.05)',
            }
          }}
        >
          Explorar o Sistema
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;