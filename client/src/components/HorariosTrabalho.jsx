import React, { useState, useEffect } from 'react';
import { Box, Autocomplete, TextField, Grid, Checkbox, FormControlLabel, Typography, Button, CircularProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from 'notistack';

const diasDaSemana = [
  { id: 'domingo', label: 'Domingo' },
  { id: 'segunda', label: 'Segunda-feira' },
  { id: 'terca', label: 'Terça-feira' },
  { id: 'quarta', label: 'Quarta-feira' },
  { id: 'quinta', label: 'Quinta-feira' },
  { id: 'sexta', label: 'Sexta-feira' },
  { id: 'sabado', label: 'Sábado' },
];

const HorariosTrabalho = ({ colaboradores, companyId }) => {
  const { supabase } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [selectedColaborador, setSelectedColaborador] = useState(null);
  const [horarios, setHorarios] = useState({});
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (selectedColaborador) {
      const fetchHorarios = async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from('colaboradores')
          .select('horario_trabalho')
          .eq('id', selectedColaborador.id)
          .single();

        if (error) {
          console.error('Erro ao buscar horários:', error);
          enqueueSnackbar('Erro ao carregar os horários do profissional.', { variant: 'error' });
          setHorarios({});
        } else {
          setHorarios(data.horario_trabalho || {});
        }
        setLoading(false);
      };
      fetchHorarios();
    } else {
      setHorarios({});
    }
  }, [selectedColaborador, supabase]);

  const handleHorarioChange = (dia, campo, valor) => {
    setHorarios(prev => ({
      ...prev,
      [dia]: {
        ...prev[dia],
        [campo]: valor,
      },
    }));
  };

  const handleTrabalhaChange = (dia, checked) => {
    setHorarios(prev => ({
      ...prev,
      [dia]: {
        ...prev[dia],
        trabalha: checked,
        // Se desmarcar, limpa os horários
        inicio: checked ? prev[dia]?.inicio || '09:00' : '',
        fim: checked ? prev[dia]?.fim || '18:00' : '',
      },
    }));
  };

  const handleSave = async () => {
    if (!selectedColaborador) {
      enqueueSnackbar('Selecione um profissional.', { variant: 'warning' });
      return;
    }
    setIsSaving(true);
    const { error } = await supabase
      .from('colaboradores')
      .update({ horario_trabalho: horarios })
      .eq('id', selectedColaborador.id);

    if (error) {
      console.error('Erro ao salvar horários:', error);
      enqueueSnackbar('Não foi possível salvar os horários.', { variant: 'error' });
    } else {
      enqueueSnackbar('Horários de trabalho atualizados com sucesso!', { variant: 'success' });
    }
    setIsSaving(false);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Editar Horários de Trabalho</Typography>
      <Autocomplete
        options={colaboradores}
        getOptionLabel={(option) => option.nome || ''}
        value={selectedColaborador}
        onChange={(event, newValue) => {
          setSelectedColaborador(newValue);
        }}
        renderInput={(params) => <TextField {...params} label="Selecione o Profissional" margin="normal" />}
        sx={{ mb: 3 }}
      />

      {loading && <CircularProgress />}

      {!loading && selectedColaborador && (
        <Grid container spacing={2}>
          {diasDaSemana.map(dia => (
            <Grid item xs={12} key={dia.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, border: '1px solid #ddd', p: 2, borderRadius: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={horarios[dia.id]?.trabalha || false}
                      onChange={(e) => handleTrabalhaChange(dia.id, e.target.checked)}
                    />
                  }
                  label={dia.label}
                  sx={{ minWidth: 120 }}
                />
                <TextField
                  label="Início"
                  type="time"
                  disabled={!horarios[dia.id]?.trabalha}
                  value={horarios[dia.id]?.inicio || ''}
                  onChange={(e) => handleHorarioChange(dia.id, 'inicio', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 120 }}
                />
                <TextField
                  label="Fim"
                  type="time"
                  disabled={!horarios[dia.id]?.trabalha}
                  value={horarios[dia.id]?.fim || ''}
                  onChange={(e) => handleHorarioChange(dia.id, 'fim', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 120 }}
                />
              </Box>
            </Grid>
          ))}
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={isSaving}
              sx={{ mt: 2 }}
            >
              {isSaving ? <CircularProgress size={24} /> : 'Salvar Horários'}
            </Button>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default HorariosTrabalho;