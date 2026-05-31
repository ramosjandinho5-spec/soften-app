import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Select, MenuItem, FormControl, InputLabel, Grid, InputAdornment, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from 'notistack';

const PagamentoModal = ({ open, onClose, agendamento, onPagamentoSuccess }) => {
  const { supabase } = useAuth();
  const [formaPagamento, setFormaPagamento] = useState('Dinheiro');
  const [valorServico, setValorServico] = useState(0);
  const [desconto, setDesconto] = useState(0);
  const [tipoDesconto, setTipoDesconto] = useState('R$');
  const [acrescimo, setAcrescimo] = useState(0);
  const [valorFinal, setValorFinal] = useState(0);
  const [loading, setLoading] = useState(false);

  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (agendamento?.servico_valor) {
      setValorServico(agendamento.servico_valor);
    }
  }, [agendamento]);

  useEffect(() => {
    let valorComAcrescimo = parseFloat(valorServico) + parseFloat(acrescimo || 0);
    let descontoAplicado = 0;

    if (tipoDesconto === 'R$') {
      descontoAplicado = parseFloat(desconto || 0);
    } else { // Porcentagem
      descontoAplicado = valorComAcrescimo * (parseFloat(desconto || 0) / 100);
    }

    const final = valorComAcrescimo - descontoAplicado;
    setValorFinal(final < 0 ? 0 : final);
  }, [valorServico, desconto, tipoDesconto, acrescimo]);

  const handleConfirmarPagamento = async () => {
    setLoading(true);
    const dataPagamento = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD

    const receitaData = {
      company_id: agendamento.company_id,
      agendamento_id: agendamento.id,
      valor_servico: valorServico,
      desconto: tipoDesconto === 'R$' ? desconto : (valorServico + acrescimo) * (desconto / 100),
      acrescimo: acrescimo,
      valor_final: valorFinal,
      forma_pagamento: formaPagamento,
      data_pagamento: dataPagamento,
    };

    try {
      // Insere na tabela de receitas
      const { error: receitaError } = await supabase.from('receitas').insert([receitaData]);
      if (receitaError) throw receitaError;

      // Atualiza o status do agendamento
      const { error: agendamentoError } = await supabase
        .from('agendamentos')
        .update({ status: 'Finalizado' })
        .eq('id', agendamento.id);
      if (agendamentoError) throw agendamentoError;

      // Adiciona ao fluxo de caixa
      const fluxoCaixaData = {
        company_id: agendamento.company_id,
        usuario_id: agendamento.user_id, // Supondo que o ID do usuário está disponível
        valor: valorFinal,
        tipo: 'ENTRADA',
        descricao: `Recebimento Agendamento #${agendamento.id}`,
        data_movimento: new Date().toISOString(),
        detalhes_pagamento: { [formaPagamento]: valorFinal }
      };
      const { error: fluxoError } = await supabase.from('fluxo_de_caixa').insert([fluxoCaixaData]);
      if (fluxoError) throw fluxoError;

      enqueueSnackbar('Pagamento registrado e agendamento finalizado com sucesso!', { variant: 'success' });
      onPagamentoSuccess();
      handleClose();
    } catch (error) {
      enqueueSnackbar(`Erro ao processar pagamento: ${error.message}`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reseta os estados ao fechar
    setFormaPagamento('Dinheiro');
    setDesconto(0);
    setTipoDesconto('R$');
    setAcrescimo(0);
    onClose();
  };

  if (!agendamento) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Finalizar e Registrar Pagamento</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              label="Serviço Realizado"
              value={`${agendamento.servico} (Cliente: ${agendamento.nome})`}
              fullWidth
              disabled
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Forma de Pagamento</InputLabel>
              <Select
                value={formaPagamento}
                label="Forma de Pagamento"
                onChange={(e) => setFormaPagamento(e.target.value)}
              >
                <MenuItem value="Dinheiro">Dinheiro</MenuItem>
                <MenuItem value="Cartão de Crédito">Cartão de Crédito</MenuItem>
                <MenuItem value="Cartão de Débito">Cartão de Débito</MenuItem>
                <MenuItem value="PIX">PIX</MenuItem>
                <MenuItem value="A Prazo">A Prazo</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Valor do Serviço"
              type="number"
              value={valorServico}
              fullWidth
              disabled
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={8}>
            <TextField
              label="Desconto"
              type="number"
              value={desconto}
              onChange={(e) => setDesconto(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start">{tipoDesconto}</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={4} display="flex" alignItems="center">
            <ToggleButtonGroup
              value={tipoDesconto}
              exclusive
              onChange={(e, newValue) => { if (newValue) setTipoDesconto(newValue); }}
              aria-label="tipo de desconto"
            >
              <ToggleButton value="R$" aria-label="reais">R$</ToggleButton>
              <ToggleButton value="%" aria-label="porcentagem">%</ToggleButton>
            </ToggleButtonGroup>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Acréscimos"
              type="number"
              value={acrescimo}
              onChange={(e) => setAcrescimo(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Valor Final"
              type="number"
              value={valorFinal.toFixed(2)}
              fullWidth
              disabled
              sx={{ '& .MuiInputBase-input': { fontWeight: 'bold', fontSize: '1.2rem' } }}
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="outlined">Cancelar</Button>
        <Button onClick={handleConfirmarPagamento} variant="contained" color="primary" disabled={loading}>
          {loading ? 'Salvando...' : 'Confirmar Pagamento'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PagamentoModal;