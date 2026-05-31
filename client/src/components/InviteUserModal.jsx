import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography
} from '@mui/material';

function InviteUserModal({ open, onClose, onInvite }) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!fullName.trim()) {
      newErrors.fullName = 'O nome é obrigatório.';
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = 'Por favor, insira um e-mail válido.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInvite = () => {
    if (!validate()) {
      return;
    }
    onInvite({ email, fullName });
    handleClose();
  };

  const handleClose = () => {
    onClose();
    setEmail('');
    setFullName('');
    setErrors({});
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Convidar Novo Usuário</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Digite o nome e o e-mail do usuário que você deseja convidar.
        </Typography>
        <TextField
          autoFocus
          margin="dense"
          id="fullName"
          label="Nome Completo"
          type="text"
          fullWidth
          variant="outlined"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={!!errors.fullName}
          helperText={errors.fullName}
        />
        <TextField
          margin="dense"
          id="email"
          label="Endereço de e-mail"
          type="email"
          fullWidth
          variant="outlined"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={!!errors.email}
          helperText={errors.email}
        />
      </DialogContent>
      <DialogActions sx={{ p: '0 24px 16px' }}>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button onClick={handleInvite} variant="contained">
          Enviar Convite
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default InviteUserModal;