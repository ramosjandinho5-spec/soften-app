import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const NovoOrcamentoServico = () => {
  const { id: orcamentoId } = useParams();
  const isEditMode = Boolean(orcamentoId);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { companyId } = useAuth();

  const [clientes, setClientes] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [selectedServico, setSelectedServico] = useState(null);
  const [selectedProfissional, setSelectedProfissional] = useState(null);
  const [itensOrcamento, setItensOrcamento] = useState([]);
  const [quantidade, setQuantidade] = useState(1);
  const [loading, setLoading] = useState(true); // Start loading true
  const [desconto, setDesconto] = useState(0);
  const [acrescimo, setAcrescimo] = useState(0);

  const subtotal = itensOrcamento.reduce((acc, item) => acc + item.subtotal, 0);
  const descontoReais = (subtotal * desconto) / 100;
  const acrescimoReais = (subtotal * acrescimo) / 100;
  const totalOrcamento = subtotal - descontoReais + acrescimoReais;

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!companyId) {
        setLoading(false);
        return;
      }

      try {
        const [
          { data: clientesData, error: clientesError },
          { data: servicosData, error: servicosError },
          { data: profilesData, error: profilesError },
        ] = await Promise.all([
          supabase.from('clientes').select('id, nome').eq('company_id', companyId),
          supabase.from('servicos').select('id, nome, valor').eq('company_id', companyId),
          supabase.from('profiles').select('id, full_name').eq('company_id', companyId),
        ]);

        if (clientesError || servicosError || profilesError) {
          throw new Error('Falha ao carregar dados iniciais.');
        }

        setClientes(clientesData || []);
        setServicos(servicosData || []);
        setProfissionais(profilesData || []);

        if (isEditMode) {
          const { data: orcamento, error: orcamentoError } = await supabase
            .from('orcamentos_servicos')
            .select('*, clientes(*), profiles(*), orcamento_servico_items(*, servicos(*))')
            .eq('id', orcamentoId)
            .single();

          if (orcamentoError || !orcamento) {
            enqueueSnackbar('Orçamento não encontrado ou erro ao carregar.', { variant: 'error' });
            navigate('/orcamentos-servicos');
            return;
          }

          setSelectedCliente(orcamento.clientes || null);
          setSelectedProfissional(orcamento.profiles || null);

          if (orcamento.subtotal > 0) {
            setDesconto((orcamento.desconto / orcamento.subtotal) * 100);
            setAcrescimo((orcamento.acrescimo / orcamento.subtotal) * 100);
          } else {
            setDesconto(0);
            setAcrescimo(0);
          }

          const items = (orcamento.orcamento_servico_items || []).map(item => {
            if (!item.servicos) {
              return {
                servico_id: item.servico_id,
                nome: 'SERVIÇO REMOVIDO',
                quantidade: item.quantidade,
                preco_unitario: 0,
                subtotal: 0,
              };
            }
            return {
              servico_id: item.servico_id,
              nome: item.servicos.nome,
              quantidade: item.quantidade,
              preco_unitario: item.preco_unitario,
              subtotal: item.subtotal,
            };
          });
          setItensOrcamento(items);
        }
      } catch (error) {
        console.error("Erro ao carregar página:", error);
        enqueueSnackbar('Erro grave ao carregar a página. Tente novamente.', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [companyId, isEditMode, orcamentoId, navigate]);

  const handleAddServico = () => {
    if (!selectedServico || quantidade <= 0) return;
    const newItem = {
      servico_id: selectedServico.id,
      nome: selectedServico.nome,
      quantidade: quantidade,
      preco_unitario: selectedServico.valor,
      subtotal: quantidade * selectedServico.valor,
    };
    setItensOrcamento(prev => [...prev, newItem]);
    setSelectedServico(null);
    setQuantidade(1);
  };

  const handleRemoveItem = (servicoId) => {
    setItensOrcamento(prev => prev.filter(item => item.servico_id !== servicoId));
  };

  const handleSave = async () => {
    if (!selectedCliente || !selectedProfissional || itensOrcamento.length === 0) {
      enqueueSnackbar('Cliente, Profissional e ao menos um item são obrigatórios.', { variant: 'warning' });
      return;
    }

    setLoading(true);
    const orcamentoData = {
      cliente_id: selectedCliente.id,
      profissional_id: selectedProfissional.id,
      company_id: companyId,
      subtotal: subtotal,
      desconto: descontoReais,
      acrescimo: acrescimoReais,
      valor_total: totalOrcamento,
      status: 'Pendente',
    };

    if (isEditMode) {
      const { error } = await supabase.from('orcamentos_servicos').update(orcamentoData).eq('id', orcamentoId);
      if (error) {
        enqueueSnackbar('Erro ao atualizar orçamento.', { variant: 'error' });
        setLoading(false);
        return;
      }
      await supabase.from('orcamento_servico_items').delete().eq('orcamento_servico_id', orcamentoId);
      const itensData = itensOrcamento.map(item => ({ ...item, orcamento_servico_id: orcamentoId }));
      await supabase.from('orcamento_servico_items').insert(itensData);
      enqueueSnackbar('Orçamento atualizado!', { variant: 'success' });

    } else {
      const { data: newOrcamento, error } = await supabase.from('orcamentos_servicos').insert(orcamentoData).select().single();
      if (error) {
        enqueueSnackbar('Erro ao criar orçamento.', { variant: 'error' });
        setLoading(false);
        return;
      }
      const itensData = itensOrcamento.map(item => ({ ...item, orcamento_servico_id: newOrcamento.id }));
      await supabase.from('orcamento_servico_items').insert(itensData);
      enqueueSnackbar('Orçamento criado!', { variant: 'success' });
    }
    navigate('/orcamentos-servicos');
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>{isEditMode ? 'Editar' : 'Novo'} Orçamento de Serviço</Typography>
      <Paper sx={{ p: 2, mt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={clientes}
              getOptionLabel={(option) => option.nome || ''}
              value={selectedCliente}
              onChange={(_, newValue) => setSelectedCliente(newValue)}
              renderInput={(params) => <TextField {...params} label="Cliente" />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={profissionais}
              getOptionLabel={(option) => option.full_name || ''}
              value={selectedProfissional}
              onChange={(_, newValue) => setSelectedProfissional(newValue)}
              renderInput={(params) => <TextField {...params} label="Profissional" />}
            />
          </Grid>
          <Grid item xs={12} sm={8}>
            <Autocomplete
              options={servicos}
              getOptionLabel={(option) => `${option.nome} - R$ ${Number(option.valor).toFixed(2)}`}
              value={selectedServico}
              onChange={(_, newValue) => setSelectedServico(newValue)}
              renderInput={(params) => <TextField {...params} label="Serviço" />}
            />
          </Grid>
          <Grid item xs={8} sm={3}>
            <TextField label="Quantidade" type="number" value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} fullWidth />
          </Grid>
          <Grid item xs={4} sm={1}>
            <Button variant="contained" onClick={handleAddServico} sx={{ height: '100%' }}><AddIcon /></Button>
          </Grid>
        </Grid>
      </Paper>

      {itensOrcamento.length > 0 && (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Serviço</TableCell>
                <TableCell>Qtd</TableCell>
                <TableCell>Preço Unit.</TableCell>
                <TableCell>Subtotal</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {itensOrcamento.map((item) => (
                <TableRow key={item.servico_id}>
                  <TableCell>{item.nome}</TableCell>
                  <TableCell>{item.quantidade}</TableCell>
                  <TableCell>R$ {Number(item.preco_unitario).toFixed(2)}</TableCell>
                  <TableCell>R$ {Number(item.subtotal).toFixed(2)}</TableCell>
                  <TableCell><IconButton onClick={() => handleRemoveItem(item.servico_id)}><DeleteIcon /></IconButton></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Paper sx={{ p: 2, mt: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={6} sm={3}><TextField label="Desconto (%)" type="number" value={desconto} onChange={(e) => setDesconto(Number(e.target.value))} fullWidth /></Grid>
          <Grid item xs={6} sm={3}><TextField label="Acréscimo (%)" type="number" value={acrescimo} onChange={(e) => setAcrescimo(Number(e.target.value))} fullWidth /></Grid>
          <Grid item xs={12} sm={6} sx={{ textAlign: 'right' }}>
            <Typography variant="h6">Subtotal: R$ {subtotal.toFixed(2)}</Typography>
            {desconto > 0 && <Typography color="error">Desconto: - R$ {descontoReais.toFixed(2)}</Typography>}
            {acrescimo > 0 && <Typography color="primary">Acréscimo: + R$ {acrescimoReais.toFixed(2)}</Typography>}
            <Typography variant="h5">Total: R$ {totalOrcamento.toFixed(2)}</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={() => navigate('/orcamentos-servicos')} sx={{ mr: 1 }}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>{loading ? <CircularProgress size={24} /> : 'Salvar'}</Button>
      </Box>
    </Box>
  );
};

export default NovoOrcamentoServico;