import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, CircularProgress, Autocomplete, Grid } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from 'notistack';

const IntervaloServicos = () => {
  const { supabase, profile } = useAuth();
  const companyId = profile?.company_id;
  const { enqueueSnackbar } = useSnackbar();
  const [intervalo, setIntervalo] = useState(15);
  const [servicos, setServicos] = useState([]);
  const [selectedServico, setSelectedServico] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!companyId) return;
      setLoading(true);

      // Buscar serviços
      const { data: servicosData, error: servicosError } = await supabase
        .from('servicos')
        .select('id, nome, configuracoes_agenda')
        .eq('company_id', companyId);

      if (servicosError) {
        console.error('Erro ao buscar serviços:', servicosError);
        enqueueSnackbar('Não foi possível carregar os serviços.', { variant: 'error' });
      } else {
        setServicos(servicosData);
      }

      setLoading(false);
    };

    fetchData();
  }, [companyId, supabase]);

  // Efeito para atualizar o intervalo quando um serviço é selecionado
  useEffect(() => {
    if (selectedServico && selectedServico.configuracoes_agenda) {
      setIntervalo(selectedServico.configuracoes_agenda.intervalo || 15);
    } else {
      setIntervalo(15); // Valor padrão
    }
  }, [selectedServico]);

  const handleSave = async () => {
    if (!selectedServico) {
      enqueueSnackbar('Por favor, selecione um serviço antes de salvar.', { variant: 'warning' });
      return;
    }
    setIsSaving(true);
    const { error } = await supabase
      .from('servicos')
      .update({ 
          configuracoes_agenda: { 
              intervalo: Number(intervalo) 
          } 
      })
      .eq('id', selectedServico.id);

    if (error) {
      console.error('Erro ao salvar intervalo do serviço:', error);
      enqueueSnackbar('Não foi possível salvar a configuração de intervalo.', { variant: 'error' });
    } else {
      enqueueSnackbar('Intervalo do serviço atualizado com sucesso!', { variant: 'success' });
      // Atualiza o estado local para refletir a mudança
      setSelectedServico(prev => ({
        ...prev,
        configuracoes_agenda: { intervalo: Number(intervalo) }
      }));
      setServicos(prev => prev.map(s => 
        s.id === selectedServico.id 
          ? { ...s, configuracoes_agenda: { intervalo: Number(intervalo) } } 
          : s
      ));
    }
    setIsSaving(false);
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Configurar Intervalo por Serviço
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Selecione um serviço e defina o intervalo de tempo (em minutos) que será usado para mostrar os horários disponíveis na agenda pública.
      </Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6}>
          <Autocomplete
            options={servicos}
            getOptionLabel={(option) => option.nome}
            value={selectedServico}
            onChange={(event, newValue) => {
              setSelectedServico(newValue);
            }}
            renderInput={(params) => <TextField {...params} label="Selecione o Serviço" />}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Intervalo (em minutos)"
            type="number"
            value={intervalo}
            onChange={(e) => setIntervalo(e.target.value)}
            InputProps={{ inputProps: { min: 1 } }}
            disabled={!selectedServico}
            fullWidth
          />
        </Grid>
      </Grid>
      <Box sx={{ mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? <CircularProgress size={24} /> : 'Salvar Intervalo'}
        </Button>
      </Box>
    </Box>
  );
};

export default IntervaloServicos;