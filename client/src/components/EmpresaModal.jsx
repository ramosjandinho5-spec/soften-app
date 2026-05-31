import React from 'react';
import { Modal, Box, Typography, Paper } from '@mui/material';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: '800px',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

function EmpresaModal({ open, onClose, children }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-empresa-title"
      aria-describedby="modal-empresa-description"
    >
      <Paper sx={style}>
        <Typography id="modal-empresa-title" variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
          Complete o Cadastro da Sua Empresa
        </Typography>
        <Typography id="modal-empresa-description" sx={{ mt: 1, mb: 3, fontSize: '0.9rem', color: 'text.secondary' }}>
          Para uma melhor experiência, preencha os dados da sua empresa. Você pode pular esta etapa e preencher depois nas configurações, mas o CNPJ não poderá ser alterado.
        </Typography>
        {children}
      </Paper>
    </Modal>
  );
}

export default EmpresaModal;