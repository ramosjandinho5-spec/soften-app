import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid, Typography, List, ListItem, ListItemText, IconButton, CircularProgress, Alert, Autocomplete, Box, Tabs, Tab } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSnackbar } from 'notistack';
import { useAuth } from '../contexts/AuthContext';
import HorariosTrabalho from './HorariosTrabalho'; // Importa o novo componente
import IntervaloServicos from './IntervaloServicos';
import GerenciarExcecoes from './GerenciarExcecoes';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const GerenciadorBloqueiosModal = ({ open, onClose, colaboradores, companyId }) => {
  const { supabase } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [tabValue, setTabValue] = useState(0);
  const [selectedColaboradorExcecao, setSelectedColaboradorExcecao] = useState(null);

  const [bloqueios, setBloqueios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados para o formulário de novo bloqueio
  const [selectedColaborador, setSelectedColaborador] = useState(null);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const fetchBloqueios = async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('bloqueios')
        .select('id, data_inicio, data_fim, motivo, colaborador_id')
        .eq('company_id', companyId)
        .order('data_inicio', { ascending: false });

      if (error) throw error;
      setBloqueios(data);
    } catch (err) {
      setError('Não foi possível carregar os bloqueios.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && tabValue === 0) { // Apenas busca bloqueios se a aba de bloqueios estiver ativa
      fetchBloqueios();
    }
  }, [open, tabValue, companyId, supabase]);

  const handleCriarBloqueio = async () => {
    // Validação
    if (!selectedColaborador || !dataInicio || !dataFim) {
      enqueueSnackbar('Por favor, preencha o profissional e as datas de início e fim.', { variant: 'warning' });
      return;
    }
    if (new Date(dataFim) <= new Date(dataInicio)) {
        enqueueSnackbar('A data final deve ser posterior à data inicial.', { variant: 'warning' });
        return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('bloqueios').insert({
        company_id: companyId,
        colaborador_id: selectedColaborador,
        data_inicio: new Date(dataInicio).toISOString(),
        data_fim: new Date(dataFim).toISOString(),
        motivo: motivo,
      });

      if (error) throw error;

      enqueueSnackbar('Bloqueio criado com sucesso!', { variant: 'success' });
      // Limpa o formulário e recarrega a lista
      setSelectedColaborador(null);
      setDataInicio('');
      setDataFim('');
      setMotivo('');
      fetchBloqueios();

    } catch (err) {
      enqueueSnackbar('Erro ao criar bloqueio.', { variant: 'error' });
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletarBloqueio = async (id) => {
    try {
        const { error } = await supabase.from('bloqueios').delete().eq('id', id);
        if (error) throw error;
        enqueueSnackbar('Bloqueio removido com sucesso!', { variant: 'success' });
        setBloqueios(prev => prev.filter(b => b.id !== id));
    } catch (err) {
        enqueueSnackbar('Erro ao remover bloqueio.', { variant: 'error' });
        console.error(err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Gerenciar Agenda</DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="abas de gerenciamento">
            <Tab label="Bloqueios" />
            <Tab label="Horários de Trabalho" />
            <Tab label="Intervalos" />
            <Tab label="Exceções" />
          </Tabs>
        </Box>
        <TabPanel value={tabValue} index={0}>
          {tabValue === 0 && (
            <Grid container spacing={4}>
              {/* Seção para Criar Novo Bloqueio */}
              <Grid item xs={12} md={5}>
                <Typography variant="h6" gutterBottom>Novo Bloqueio</Typography>
                <Autocomplete
                  options={colaboradores}
                  getOptionLabel={(option) => option.nome || ''}
                  value={colaboradores.find(c => c.id === selectedColaborador) || null}
                  onChange={(event, newValue) => {
                    setSelectedColaborador(newValue ? newValue.id : null);
                  }}
                  renderInput={(params) => <TextField {...params} label="Profissional" />}
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Data e Hora de Início"
                  type="datetime-local"
                  fullWidth
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Data e Hora de Fim"
                  type="datetime-local"
                  fullWidth
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Motivo (Opcional)"
                  fullWidth
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button 
                    onClick={handleCriarBloqueio} 
                    variant="contained" 
                    disabled={isSubmitting}
                >
                  {isSubmitting ? <CircularProgress size={24} /> : 'Criar Bloqueio'}
                </Button>
              </Grid>

              {/* Seção para Listar Bloqueios Existentes */}
              <Grid item xs={12} md={7}>
                <Typography variant="h6" gutterBottom>Bloqueios Ativos</Typography>
                {loading && <CircularProgress />}
                {error && <Alert severity="error">{error}</Alert>}
                {!loading && !error && (
                  <List>
                    {bloqueios.map(bloqueio => (
                      <ListItem 
                        key={bloqueio.id}
                        secondaryAction={
                          <IconButton edge="end" aria-label="delete" onClick={() => handleDeletarBloqueio(bloqueio.id)}>
                            <DeleteIcon />
                          </IconButton>
                        }
                      >
                        <ListItemText
                          primary={`${colaboradores.find(c => c.id === bloqueio.colaborador_id)?.nome || 'Profissional não encontrado'}`}
                          secondary={`De: ${new Date(bloqueio.data_inicio).toLocaleString('pt-BR')} - Até: ${new Date(bloqueio.data_fim).toLocaleString('pt-BR')}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Grid>
            </Grid>
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          {tabValue === 1 && (
            <HorariosTrabalho
              colaboradores={colaboradores}
              companyId={companyId}
            />
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          {tabValue === 2 && <IntervaloServicos />}
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          {tabValue === 3 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Autocomplete
                    options={colaboradores}
                    getOptionLabel={(option) => option.nome || ''}
                    value={colaboradores.find(c => c.id === selectedColaboradorExcecao) || null}
                    onChange={(event, newValue) => {
                        setSelectedColaboradorExcecao(newValue ? newValue.id : null);
                    }}
                    renderInput={(params) => <TextField {...params} label="Selecione um Profissional" />}
                    sx={{ mb: 2, width: '100%', maxWidth: '400px' }}
                />
              </Grid>
              <Grid item xs={12}>
                {selectedColaboradorExcecao ? (
                    <GerenciarExcecoes
                        professionalId={selectedColaboradorExcecao}
                        companyId={companyId}
                        supabase={supabase}
                    />
                ) : (
                    <Alert severity="info">Selecione um profissional para gerenciar as exceções de horário.</Alert>
                )}
              </Grid>
            </Grid>
          )}
        </TabPanel>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default GerenciadorBloqueiosModal;