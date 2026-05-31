import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box
} from '@mui/material';

function CategoryModal({ open, onClose, onSave }) {
  const [categoryName, setCategoryName] = useState('');

  const handleSave = () => {
    if (categoryName.trim()) {
      onSave({ name: categoryName });
      setCategoryName(''); // Limpa o campo
      onClose(); // Fecha o modal
    }
  };

  const handleClose = () => {
    setCategoryName('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} PaperProps={{ sx: { width: '100%', maxWidth: '500px' } }}>
      <DialogTitle>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          Nova Categoria
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Typography gutterBottom>
          Digite o nome para a nova categoria.
        </Typography>
        <TextField
          autoFocus
          margin="dense"
          label="Nome da Categoria"
          type="text"
          fullWidth
          variant="outlined"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
        />
        {/* Espaço para adicionar o seletor de categoria pai no futuro */}
      </DialogContent>
      <DialogActions sx={{ p: '16px 24px' }}>
        <Button onClick={handleClose} variant="outlined">Cancelar</Button>
        <Button onClick={handleSave} variant="contained">Salvar</Button>
      </DialogActions>
    </Dialog>
  );
}

export default CategoryModal;