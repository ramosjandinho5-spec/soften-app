import React from 'react';
import { Modal, Box, Paper, Typography } from '@mui/material';

const ClientModal = ({ open, onClose, children }) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="client-modal-title"
      aria-describedby="client-modal-description"
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <Paper sx={{ p: 4, width: '90%', maxWidth: '600px' }}>
          {children}
        </Paper>
      </Box>
    </Modal>
  );
};

export default ClientModal;