import React from 'react';
import { Box, Button, TextField, Typography, Grid, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const ClientRegistrationForm = ({ client, setClient, onSave, onSkip, saving, handleCepSearch, isEditing, showSkipButton = true }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setClient(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Dados Principais
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            id="cpf"
            label="CPF"
            name="cpf"
            value={client.cpf}
            onChange={handleChange}
            autoFocus
            disabled={isEditing}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            id="fullName"
            label="Nome Completo"
            name="fullName"
            value={client.fullName}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            id="email"
            label="Email"
            name="email"
            value={client.email}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            id="companyName"
            label="Nome da Empresa (Opcional)"
            name="companyName"
            value={client.companyName}
            onChange={handleChange}
          />
        </Grid>
      </Grid>

      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Endereço
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
            <TextField
                name="cep"
                label="CEP"
                value={client.cep || ''}
                onChange={handleChange}
                fullWidth
                InputProps={{
                    endAdornment: (
                        <IconButton onClick={handleCepSearch} edge="end">
                            <SearchIcon />
                        </IconButton>
                    ),
                }}
            />
        </Grid>
        <Grid item xs={12} sm={8}>
            <TextField name="logradouro" label="Rua" value={client.logradouro || ''} onChange={handleChange} fullWidth />
        </Grid>
        <Grid item xs={12} sm={4}>
            <TextField name="numero" label="Número" value={client.numero || ''} onChange={handleChange} fullWidth />
        </Grid>
        <Grid item xs={12} sm={8}>
            <TextField name="bairro" label="Bairro" value={client.bairro || ''} onChange={handleChange} fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
            <TextField name="municipio" label="Cidade" value={client.municipio || ''} onChange={handleChange} fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
            <TextField name="uf" label="Estado" value={client.uf || ''} onChange={handleChange} fullWidth />
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        {showSkipButton && (
          <Button
            variant="outlined"
            onClick={onSkip}
            disabled={saving}
          >
            Pular
          </Button>
        )}
        <Button
          variant="contained"
          onClick={onSave}
          disabled={saving}
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </Box>
    </Box>
  );
};

export default ClientRegistrationForm;