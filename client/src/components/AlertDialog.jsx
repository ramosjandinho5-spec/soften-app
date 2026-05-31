import React from 'react';
import { Modal, Box, Typography, Button, Paper } from '@mui/material';

const AlertDialog = ({ open, onClose, title, message }) => {
  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <Paper sx={{ p: 4, width: '90%', maxWidth: '500px', textAlign: 'center' }}>
          <Typography variant="h5" component="h2" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            {message}
          </Typography>
          <Button
            variant="contained"
            onClick={onClose}
            sx={{ mt: 4 }}
          >
            Entendi
          </Button>
        </Paper>
      </Box>
    </Modal>
  );
};

export default AlertDialog;