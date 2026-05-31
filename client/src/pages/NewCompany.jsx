import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  Grid,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import SearchIcon from '@mui/icons-material/Search';

const NewCompany = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cnpj: '',
    razao_social: '',
    nome_fantasia: '',
    inscricao_estadual: '',
    telefone: '',
    endereco: '',
    bairro: '',
    cidade: '',
    estado: '',
    email: '',
  });
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();

  const [isFetchingCnpj, setIsFetchingCnpj] = useState(false);

  const handleCnpjSearch = async () => {
    const cnpj = formData.cnpj.replace(/\D/g, ''); // Remove caracteres não numéricos
    if (cnpj.length !== 14) {
      enqueueSnackbar('Por favor, insira um CNPJ válido com 14 dígitos.', { variant: 'warning' });
      return;
    }

    setIsFetchingCnpj(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      const data = await response.json();

      if (response.ok) {
        setFormData(prev => ({
          ...prev,
          razao_social: data.razao_social || '',
          nome_fantasia: data.nome_fantasia || '',
          endereco: `${data.logradouro || ''}, ${data.numero || ''} - ${data.complemento || ''}`.replace(/ , - $/, ''),
          bairro: data.bairro || '',
          cidade: data.municipio || '',
          estado: data.uf || '',
          telefone: `${data.ddd_telefone_1 || ''}`.trim(),
          email: data.email || '',
        }));
        enqueueSnackbar('Dados da empresa preenchidos!', { variant: 'success' });
      } else {
        throw new Error(data.message || 'Erro ao buscar CNPJ.');
      }
    } catch (error) {
      enqueueSnackbar(error.message, { variant: 'error' });
    } finally {
      setIsFetchingCnpj(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Insere a nova empresa
      const { data: newCompany, error: insertError } = await supabase
        .from('empresas')
        .insert([
          {
            ...formData,
            user_id: user.id, // Associa a empresa ao usuário logado
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      enqueueSnackbar('Nova empresa cadastrada com sucesso!', { variant: 'success' });
      
      // Opcional: definir a nova empresa como a ativa
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ company_id: newCompany.id })
        .eq('id', user.id);

      if (updateProfileError) throw updateProfileError;

      navigate('/dashboard'); // Redireciona para o dashboard com a nova empresa ativa

    } catch (error) {
      enqueueSnackbar(`Erro ao cadastrar empresa: ${error.message}`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: '16px' }}>
        <Typography variant="h4" component="h1" sx={{ mb: 4, textAlign: 'center' }}>
          Cadastrar Nova Empresa
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="cnpj"
                label="CNPJ"
                name="cnpj"
                autoFocus
                value={formData.cnpj}
                onChange={handleChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleCnpjSearch} disabled={isFetchingCnpj}>
                        {isFetchingCnpj ? <CircularProgress size={24} /> : <SearchIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="razao_social"
                label="Nome da Empresa / Razão Social"
                name="razao_social"
                value={formData.razao_social}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="nome_fantasia"
                label="Nome Fantasia"
                name="nome_fantasia"
                value={formData.nome_fantasia}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="inscricao_estadual"
                label="Inscrição Estadual"
                name="inscricao_estadual"
                value={formData.inscricao_estadual}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="telefone"
                label="Telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="endereco"
                label="Endereço"
                name="endereco"
                value={formData.endereco}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                id="bairro"
                label="Bairro"
                name="bairro"
                value={formData.bairro}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                id="cidade"
                label="Cidade"
                name="cidade"
                value={formData.cidade}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                id="estado"
                label="Estado"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="email"
                label="E-mail"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Salvar e Acessar'}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => navigate('/trocar-empresa')}
          >
            Cancelar
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default NewCompany;