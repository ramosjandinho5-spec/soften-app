import React from 'react';
import { Grid, TextField, Button, InputAdornment, IconButton, CircularProgress, Box } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

function EmpresaForm({ empresa, setEmpresa, handleCnpjSearch, handleSave, saving, onSkip, showSkipButton = false, cnpjDisabled = false }) {

  const handleChange = (event) => {
    const { name, value } = event.target;
    setEmpresa(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="CNPJ"
          name="cnpj"
          value={empresa.cnpj || ''}
          onChange={handleChange}
          variant="outlined"
          InputProps={{
            readOnly: cnpjDisabled,
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={handleCnpjSearch}>
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Nome da Empresa / Razão Social" name="razao_social" value={empresa.razao_social || ''} onChange={handleChange} variant="outlined" InputLabelProps={{ shrink: true }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Nome Fantasia" name="nome_fantasia" value={empresa.nome_fantasia || ''} onChange={handleChange} variant="outlined" InputLabelProps={{ shrink: true }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Inscrição Estadual" name="inscricao_estadual" value={empresa.inscricao_estadual || ''} onChange={handleChange} variant="outlined" InputLabelProps={{ shrink: true }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Telefone" name="telefone" value={empresa.telefone || ''} onChange={handleChange} variant="outlined" InputLabelProps={{ shrink: true }} />
      </Grid>
      <Grid item xs={12}>
        <TextField fullWidth label="Endereço" name="logradouro" value={empresa.logradouro || ''} onChange={handleChange} variant="outlined" InputLabelProps={{ shrink: true }} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField fullWidth label="Bairro" name="bairro" value={empresa.bairro || ''} onChange={handleChange} variant="outlined" InputLabelProps={{ shrink: true }} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField fullWidth label="Cidade" name="municipio" value={empresa.municipio || ''} onChange={handleChange} variant="outlined" InputLabelProps={{ shrink: true }} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField fullWidth label="Estado" name="uf" value={empresa.uf || ''} onChange={handleChange} variant="outlined" InputLabelProps={{ shrink: true }} />
      </Grid>
      <Grid item xs={12}>
        <TextField fullWidth label="E-mail" name="email" value={empresa.email || ''} onChange={handleChange} variant="outlined" InputLabelProps={{ shrink: true }} />
      </Grid>
      <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {showSkipButton && (
            <Button variant="outlined" onClick={onSkip} disabled={saving}>
              Pular Etapa
            </Button>
          )}
          <Button variant="contained" color="primary" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={24} /> : 'Salvar Informações'}
          </Button>
        </Box>
      </Grid>
    </Grid>
  );
}

export default EmpresaForm;