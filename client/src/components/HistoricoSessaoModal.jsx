import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, CircularProgress, Typography, Box,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { supabase } from '../supabaseClient';

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const HistoricoSessaoModal = ({ open, onClose, sessaoId }) => {
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVendas = async () => {
      if (!open || !sessaoId) {
        setVendas([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('vendas')
          .select('id, created_at, valor_total, detalhes_pagamento, cliente:clientes(nome)')
          .eq('sessao_caixa_id', sessaoId)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        setVendas(data);
      } catch (err) {
        console.error("Erro ao buscar histórico de vendas da sessão:", err);
        setError("Não foi possível carregar o histórico de vendas.");
      } finally {
        setLoading(false);
      }
    };

    fetchVendas();
  }, [open, sessaoId]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Histórico de Vendas da Sessão
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center">{error}</Typography>
        ) : vendas.length === 0 ? (
          <Typography align="center" sx={{ my: 4 }}>Nenhuma venda encontrada para esta sessão.</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Data/Hora</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell align="right">Valor Total</TableCell>
                  <TableCell>Formas de Pagamento</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vendas.map((venda) => (
                  <TableRow key={venda.id} hover>
                    <TableCell>{new Date(venda.created_at).toLocaleString('pt-BR')}</TableCell>
                    <TableCell>{venda.cliente?.nome || 'N/A'}</TableCell>
                    <TableCell align="right">{formatCurrency(venda.valor_total)}</TableCell>
                    <TableCell>
                      {venda.detalhes_pagamento ? (
                        Object.entries(venda.detalhes_pagamento).map(([metodo, valor]) => (
                          <Chip key={metodo} label={`${metodo}: ${formatCurrency(valor)}`} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                        ))
                      ) : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default HistoricoSessaoModal;