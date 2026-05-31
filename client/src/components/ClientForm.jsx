import React from 'react';
import { TextField, Grid, Button, Box, CircularProgress } from '@mui/material';

const ClientForm = ({ empresa, setEmpresa, handleSave, saving }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmpresa(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Box component="form" noValidate sx={{ mt: 3 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            name="cpf"
            required
            fullWidth
            id="cpf"
            label="CPF"
            value={empresa.cpf || ''}
            onChange={handleChange}
            disabled
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="nome_completo"
            required
            fullWidth
            id="nome_completo"
            label="Nome Completo"
            value={empresa.nome_completo || ''}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            name="nome_fantasia"
            fullWidth
            id="nome_fantasia"
            label="Nome da Empresa (Opcional)"
            value={empresa.nome_fantasia || ''}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="email"
            fullWidth
            id="email"
            label="E-mail"
            value={empresa.email || ''}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="telefone"
            fullWidth
            id="telefone"
            label="Telefone"
            value={empresa.telefone || ''}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            name="logradouro"
            fullWidth
            id="logradouro"
            label="Endereço"
            value={empresa.logradouro || ''}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="bairro"
            fullWidth
            id="bairro"
            label="Bairro"
            value={empresa.bairro || ''}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            name="municipio"
            fullWidth
            id="municipio"
            label="Cidade"
            value={empresa.municipio || ''}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            name="uf"
            fullWidth
            id="uf"
            label="Estado"
            value={empresa.uf || ''}
            onChange={handleChange}
          />
        </Grid>
      </Grid>
      <Button
        type="button"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? <CircularProgress size={24} /> : 'Salvar Informações'}
      </Button>
    </Box>
  );
};

export default ClientForm;