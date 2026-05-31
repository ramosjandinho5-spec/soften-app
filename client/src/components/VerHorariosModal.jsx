import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid,
  TextField, Autocomplete, CircularProgress, Box, Typography, Chip
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext'; // Para acessar o Supabase

const VerHorariosModal = ({ open, onClose, profissionais, servicos, companyId }) => {
  const { supabase } = useAuth();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [error, setError] = useState('');

  // Reset state when modal is closed
  useEffect(() => {
    if (!open) {
      setSelectedDate('');
      setSelectedProfessional(null);
      setAvailableTimes([]);
      setLoadingTimes(false);
      setError('');
    }
  }, [open]);

  const fetchAvailableTimes = async () => {
    if (!selectedDate || !selectedProfessional || !companyId) {
      setError('Por favor, selecione data e profissional.');
      return;
    }

    setLoadingTimes(true);
    setError('');
    setAvailableTimes([]);

    try {
      const agendaIntervalo = selectedService.configuracoes_agenda?.intervalo || selectedService.duracao;
      const dateString = selectedDate;

      // --- LÓGICA CORRIGIDA ---
      // 1. Buscar por horários de exceção primeiro
      let workHoursString = '';
      const { data: exceptions, error: exceptionError } = await supabase
        .from('horarios_excecao')
        .select('horario_inicio, horario_fim')
        .eq('colaborador_id', selectedProfessional.id)
        .eq('data', dateString);

      if (exceptionError) {
        console.error('Erro ao buscar horários de exceção:', exceptionError);
        // Não interrompe, apenas loga e continua para o horário padrão
      }

      if (exceptions && exceptions.length > 0) {
        // Usa o horário de exceção se existir
        const exception = exceptions[0];
        workHoursString = `${exception.horario_inicio.substring(0, 5)}-${exception.horario_fim.substring(0, 5)}`;
      } else {
        // 2. Se não houver exceção, busca o horário de trabalho regular
        const professionalWorkHours = selectedProfessional.horario_trabalho;
        const dias = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
        const [year, month, day] = selectedDate.split('-').map(Number);
        const dateForDay = new Date(year, month - 1, day);
        const diaDaSemana = dias[dateForDay.getDay()];

        if (professionalWorkHours && professionalWorkHours[diaDaSemana]?.trabalha) {
          const regularHours = professionalWorkHours[diaDaSemana];
          workHoursString = `${regularHours.inicio}-${regularHours.fim}`;
        }
      }

      // 3. Se não encontrou nem exceção nem horário regular, o profissional não trabalha
      if (!workHoursString) {
        setError('O profissional não trabalha neste dia.');
        setLoadingTimes(false);
        return;
      }

      const [start, end] = workHoursString.split('-');
      const workStartInMinutes = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);
      const workEndInMinutes = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);
      // --- FIM DA LÓGICA CORRIGIDA ---

      // 4. Buscar agendamentos e bloqueios para o dia e profissional
      const { data: agendamentos, error: agendamentosError } = await supabase
        .from('agendamentos')
        .select('hora, servico_id')
        .eq('company_id', companyId)
        .eq('colaborador_id', selectedProfessional.id)
        .eq('data', dateString)
        .in('status', ['Agendado', 'Confirmado']);

      if (agendamentosError) throw agendamentosError;

      const { data: bloqueios, error: bloqueiosError } = await supabase
        .from('bloqueios')
        .select('data_inicio, data_fim')
        .eq('colaborador_id', selectedProfessional.id)
        .lte('data_inicio', `${dateString}T23:59:59Z`)
        .gte('data_fim', `${dateString}T00:00:00Z`);

      if (bloqueiosError) throw bloqueiosError;

      // 5. Mapear durações dos serviços
      const servicosMap = new Map(servicos.map(s => [s.id, s.duracao]));

      // 6. Gerar todos os slots possíveis
      const allTimes = [];
      const workIntervals = workHoursString.split(',');

      workIntervals.forEach(interval => {
        const [start, end] = interval.split('-');
        const openingTime = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);
        const closingTime = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);

        for (let time = openingTime; time < closingTime; time += agendaIntervalo) {
          allTimes.push(time);
        }
      });

      // 7. Marcar slots ocupados por agendamentos
      const occupiedSlots = new Set();
      agendamentos.forEach(agendamento => {
        const start = parseInt(agendamento.hora.split(':')[0]) * 60 + parseInt(agendamento.hora.split(':')[1]);
        const duration = servicosMap.get(agendamento.servico_id) || 60; // Default 60 min
        for (let i = 0; i < duration; i += agendaIntervalo) {
          occupiedSlots.add(start + i);
        }
      });

      // 8. Marcar slots ocupados por bloqueios
      const selectedDateMidnight = new Date(`${dateString}T00:00:00`);
      bloqueios.forEach(bloqueio => {
        const blockStart = new Date(bloqueio.data_inicio);
        const blockEnd = new Date(bloqueio.data_fim);

        // Garante que o bloqueio seja considerado apenas dentro do dia selecionado
        const startMinutes = blockStart < selectedDateMidnight 
            ? 0 
            : blockStart.getHours() * 60 + blockStart.getMinutes();

        const endMinutes = blockEnd > new Date(`${dateString}T23:59:59`) 
            ? 1440 // 24 * 60
            : blockEnd.getHours() * 60 + blockEnd.getMinutes();

        for (let time = startMinutes; time < endMinutes; time += agendaIntervalo) {
          occupiedSlots.add(time);
        }
      });

      // 9. Filtrar horários disponíveis com base na duração do serviço
      if (!selectedService) {
        setAvailableTimes([]); // Limpa se nenhum serviço estiver selecionado
        setLoadingTimes(false);
        return;
      }

      const serviceDuration = selectedService.duracao;
      if (!serviceDuration) {
        console.error('A duração do serviço não está definida.');
        setAvailableTimes([]);
        setLoadingTimes(false);
        return;
      }

      const finalTimes = [];
      // Itera pelos horários de início possíveis
      for (let time = workStartInMinutes; time <= workEndInMinutes - serviceDuration; ) {
        let isSlotAvailable = true;
        // Verifica se a duração completa do serviço cabe a partir de 'time'
        for (let i = 0; i < serviceDuration; i++) {
          if (occupiedSlots.has(time + i)) {
            isSlotAvailable = false;
            break;
          }
        }

        if (isSlotAvailable) {
          // Se couber, adiciona o horário de início
          finalTimes.push(time);
          // E pula para o próximo horário de início que não sobrepõe, alinhado ao grid.
          // Ex: Serviço de 30min em grid de 15min. Pula 2 slots (30/15).
          // Ex: Serviço de 40min em grid de 15min. Pula 3 slots (ceil(40/15)).
          const slotsToSkip = Math.ceil(serviceDuration / agendaIntervalo);
          time += slotsToSkip * agendaIntervalo;
        } else {
          // Se não couber, apenas avança para o próximo ponto do grid.
          time += agendaIntervalo;
        }
      }

      const formattedTimes = finalTimes.map(time => {
        const hours = Math.floor(time / 60).toString().padStart(2, '0');
        const minutes = (time % 60).toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      });

      setAvailableTimes(formattedTimes);
    } catch (err) {
      console.error('Erro ao buscar horários:', err);
      setError('Não foi possível buscar os horários. Tente novamente.');
    } finally {
      setLoadingTimes(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Verificar Horários Disponíveis</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Data"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Autocomplete
              options={profissionais}
              getOptionLabel={(option) => option.nome || ''}
              value={selectedProfessional}
              onChange={(e, value) => setSelectedProfessional(value)}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => <TextField {...params} label="Profissional" />}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Autocomplete
              options={servicos}
              getOptionLabel={(option) => option.nome || ''}
              value={selectedService}
              onChange={(e, value) => setSelectedService(value)}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => <TextField {...params} label="Serviço" />}
            />
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <Button
            variant="contained"
            onClick={fetchAvailableTimes}
            disabled={loadingTimes || !selectedDate || !selectedProfessional}
          >
            {loadingTimes ? <CircularProgress size={24} /> : 'Buscar Horários'}
          </Button>
        </Box>

        {error && <Typography color="error" align="center" sx={{ my: 2 }}>{error}</Typography>}

        <Box sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: 1, minHeight: 100 }}>
          <Typography variant="h6" gutterBottom>Horários Disponíveis:</Typography>
          {loadingTimes ? (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {availableTimes.length > 0 ? (
                availableTimes.map((time, index) => <Chip key={index} label={time} />)
              ) : (
                <Typography>Nenhum horário disponível com os filtros selecionados.</Typography>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default VerHorariosModal;