import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  InputAdornment,
  Autocomplete,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import { useSnackbar } from 'notistack';
import CategoryModal from '../components/CategoryModal';

function CadastroServicos() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [formState, setFormState] = useState({
    nome: '',
    valor: '',
    duracao: '',
    category_id: null,
  });
  const [categories, setCategories] = useState([]);
  const [companyId, setCompanyId] = useState(null);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);

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
    if (companyId) {
      fetchCategories();
    }
  }, [companyId]);

  useEffect(() => {
    const fetchService = async () => {
      if (id && companyId) {
        try {
          const { data, error } = await supabase
            .from('servicos')
            .select('*')
            .match({ id: id, company_id: companyId })
            .single();
          if (error) throw error;
          if (data) {
            setFormState(data);
          }
        } catch (error) {
          enqueueSnackbar(`Erro ao buscar serviço: ${error.message}`, { variant: 'error' });
        }
      }
    };
    fetchService();
  }, [id, companyId, enqueueSnackbar]);

  const fetchCategories = async () => {
    if (!companyId) return;
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('company_id', companyId)
        .eq('type', 'servico');
      if (error) throw error;
      setCategories(data);
    } catch (error) {
      enqueueSnackbar(`Erro ao buscar categorias: ${error.message}`, { variant: 'error' });
    }
  };

  const handleOpenCategoryModal = () => setCategoryModalOpen(true);
  const handleCloseCategoryModal = () => setCategoryModalOpen(false);

  const handleSaveCategory = async (newCategory) => {
    if (!companyId) {
      enqueueSnackbar('ID da empresa não encontrado.', { variant: 'error' });
      return;
    }
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name: newCategory.name, description: newCategory.description, company_id: companyId, type: 'servico' }])
        .select();
      if (error) throw error;
      enqueueSnackbar(`Categoria "${newCategory.name}" salva com sucesso!`, { variant: 'success' });
      fetchCategories(); // Atualiza a lista
    } catch (error) {
      enqueueSnackbar(`Erro ao salvar categoria: ${error.message}`, { variant: 'error' });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (event, newValue) => {
    setFormState((prev) => ({
      ...prev,
      category_id: newValue ? newValue.id : null,
    }));
  };

  const handleSave = async () => {
    if (!companyId) {
      enqueueSnackbar('ID da empresa não encontrado.', { variant: 'error' });
      return;
    }

    try {
      const servicePayload = { ...formState, company_id: companyId };
      let error;

      if (id) {
        // Atualizar serviço existente
        const { error: updateError } = await supabase
          .from('servicos')
          .update(servicePayload)
          .match({ id: id, company_id: companyId });
        error = updateError;
      } else {
        // Inserir novo serviço
        const { error: insertError } = await supabase
          .from('servicos')
          .insert([servicePayload]);
        error = insertError;
      }

      if (error) throw error;

      enqueueSnackbar(`Serviço ${id ? 'atualizado' : 'salvo'} com sucesso!`, { variant: 'success' });
      navigate('/servicos');

    } catch (error) {
      enqueueSnackbar(`Erro ao salvar serviço: ${error.message}`, { variant: 'error' });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        {id ? 'Editar Serviço' : 'Novo Serviço'}
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nome do Serviço"
              name="nome"
              value={formState.nome}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Valor"
              name="valor"
              value={formState.valor}
              onChange={handleInputChange}
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Duração (em minutos)"
              name="duracao"
              type="number"
              value={formState.duracao}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              fullWidth
              options={categories}
              getOptionLabel={(option) => option.name || ''}
              value={categories.find(cat => cat.id === formState.category_id) || null}
              onChange={handleCategoryChange}
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Categoria"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {params.InputProps.endAdornment}
                        <IconButton onClick={handleOpenCategoryModal} disabled={!companyId}>
                          <AddIcon />
                        </IconButton>
                      </>
                    ),
                  }}
                />
              )}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" color="primary" onClick={() => navigate('/servicos')}>
            Cancelar
          </Button>
          <Button variant="contained" color="primary" onClick={handleSave} disabled={!companyId}>
            {id ? 'Atualizar' : 'Salvar'}
          </Button>
        </Box>
      </Paper>

      <CategoryModal
        open={isCategoryModalOpen}
        onClose={handleCloseCategoryModal}
        onSave={handleSaveCategory}
      />
    </Box>
  );
}

export default CadastroServicos;