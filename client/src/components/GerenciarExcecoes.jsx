import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Paper,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSnackbar } from 'notistack';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const GerenciarExcecoes = ({ professionalId, companyId, supabase }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const fetchExceptions = useCallback(async () => {
    if (!professionalId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('horarios_excecao')
        .select('id, data, horario_inicio, horario_fim')
        .eq('colaborador_id', professionalId)
        .order('data', { ascending: false });

      if (error) throw error;
      setExceptions(data);
    } catch (error) {
      enqueueSnackbar('Erro ao carregar exceções.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [professionalId, supabase, enqueueSnackbar]);

  useEffect(() => {
    fetchExceptions();
  }, [fetchExceptions]);

  const handleSaveException = async () => {
    if (!selectedDate || !startTime || !endTime) {
      enqueueSnackbar('Por favor, preencha todos os campos.', { variant: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const { error } = await supabase.from('horarios_excecao').upsert([{
        colaborador_id: professionalId,
        company_id: companyId,
        data: formattedDate,
        horario_inicio: startTime,
        horario_fim: endTime,
      }], { onConflict: 'colaborador_id,data' });

      if (error) throw error;
      enqueueSnackbar('Exceção salva com sucesso!', { variant: 'success' });
      fetchExceptions();
      setSelectedDate(null);
      setStartTime('');
      setEndTime('');
    } catch (error) {
      enqueueSnackbar('Erro ao salvar exceção.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteException = async (id) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('horarios_excecao').delete().eq('id', id);
      if (error) throw error;
      enqueueSnackbar('Exceção excluída com sucesso!', { variant: 'success' });
      fetchExceptions();
    } catch (error) {
      enqueueSnackbar('Erro ao excluir exceção.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h6" gutterBottom>
          Adicionar Nova Exceção
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <DatePicker
              label="Data"
              inputFormat="dd/MM/yyyy"
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              label="Início"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField
              label="Fim"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              variant="contained"
              onClick={handleSaveException}
              disabled={loading}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : 'Salvar'}
            </Button>
          </Grid>
        </Grid>

        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
          Exceções Cadastradas
        </Typography>
        <Paper>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {exceptions.map((ex) => {
                // A data vem como 'YYYY-MM-DD' do Supabase, e new Date() pode interpretar incorretamente como UTC.
                // Adicionar 'T00:00:00' garante que seja interpretada no fuso horário local.
                const displayDate = format(new Date(`${ex.data}T00:00:00`), 'dd/MM/yyyy', { locale: ptBR });
                return (
                  <ListItem key={ex.id} divider>
                    <ListItemText
                      primary={`${displayDate} - ${ex.horario_inicio} às ${ex.horario_fim}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteException(ex.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })}
            </List>
          )}
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default GerenciarExcecoes;