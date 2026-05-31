import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  MenuItem,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import { useSnackbar } from 'notistack';

function CadastroColaborador() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [formState, setFormState] = useState({
    nome: '',
    funcao: '',
    comissao_padrao: '',
    status: 'Ativo',
  });
  const [companyId, setCompanyId] = useState(null);

  useEffect(() => {
    const fetchCompanyId = async () => {
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();
        if (profile?.company_id) {
          setCompanyId(profile.company_id);
        }
      }
    };
    fetchCompanyId();
  }, [user]);

  useEffect(() => {
    const fetchColaborador = async () => {
      if (id && companyId) {
        try {
          const { data, error } = await supabase
            .from('colaboradores')
            .select('*')
            .match({ id: id, company_id: companyId })
            .single();
          if (error) throw error;
          if (data) {
            setFormState(data);
          }
        } catch (error) {
          enqueueSnackbar(`Erro ao buscar colaborador: ${error.message}`, { variant: 'error' });
        }
      }
    };
    fetchColaborador();
  }, [id, companyId, enqueueSnackbar]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!companyId) {
      enqueueSnackbar('ID da empresa não encontrado.', { variant: 'error' });
      return;
    }

    try {
      const payload = { ...formState, company_id: companyId };
      let error;

      if (id) {
        const { error: updateError } = await supabase
          .from('colaboradores')
          .update(payload)
          .match({ id: id, company_id: companyId });
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('colaboradores')
          .insert([payload]);
        error = insertError;
      }

      if (error) throw error;

      enqueueSnackbar(`Colaborador ${id ? 'atualizado' : 'salvo'} com sucesso!`, { variant: 'success' });
      navigate('/colaboradores');

    } catch (error) {
      enqueueSnackbar(`Erro ao salvar colaborador: ${error.message}`, { variant: 'error' });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        {id ? 'Editar Colaborador' : 'Novo Colaborador'}
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nome do Colaborador"
              name="nome"
              value={formState.nome}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Função</InputLabel>
              <Select
                name="funcao"
                value={formState.funcao}
                onChange={handleInputChange}
                label="Função"
              >
                <MenuItem value="Profissional">Profissional (executa serviços)</MenuItem>
                <MenuItem value="Vendedor">Vendedor</MenuItem>
                <MenuItem value="Ambos">Ambos</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Comissão Padrão"
              name="comissao_padrao"
              type="number"
              value={formState.comissao_padrao}
              onChange={handleInputChange}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formState.status}
                onChange={handleInputChange}
                label="Status"
              >
                <MenuItem value="Ativo">Ativo</MenuItem>
                <MenuItem value="Inativo">Inativo</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" color="primary" onClick={() => navigate('/colaboradores')}>
            Cancelar
          </Button>
          <Button variant="contained" color="primary" onClick={handleSave} disabled={!companyId}>
            {id ? 'Atualizar' : 'Salvar'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default CadastroColaborador;