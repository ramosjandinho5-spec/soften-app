import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const MovimentacoesTable = ({ data, onOpenDetails }) => {
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState(null);

  const handleOpenDetails = (details) => {
    setSelectedDetails(details);
    setOpenDetails(true);
  };

  const handleCloseDetails = () => {
    setOpenDetails(false);
    setSelectedDetails(null);
  };

  if (!data || data.length === 0) {
    return (
      <Box component={Paper} sx={{ mt: 4, p: 3, textAlign: 'center' }}>
        <Typography>Nenhuma movimentação encontrada para o período selecionado.</Typography>
      </Box>
    );
  }

  return (
    <>
      <TableContainer component={Paper} sx={{ mt: 4 }}>
        <Table sx={{ minWidth: 650 }} aria-label="tabela de movimentações">
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Data e Hora</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Descrição</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Operador</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Tipo</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Valor</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{new Date(row.data_movimento).toLocaleString('pt-BR')}</TableCell>
                <TableCell>{row.descricao}</TableCell>
                <TableCell>{row.usuario?.full_name || 'N/A'}</TableCell>
                <TableCell align="right">
                  <Typography
                    variant="body2"
                    sx={{
                      color: row.tipo === 'ENTRADA' ? 'success.main' : 'error.main',
                      fontWeight: 'bold'
                    }}
                  >
                    {row.tipo}
                  </Typography>
                </TableCell>
                <TableCell align="right">{formatCurrency(row.valor)}</TableCell>
                <TableCell align="center">
                  {row.descricao.startsWith("Fechamento de Caixa") ? (
                    <IconButton onClick={() => onOpenDetails(row.descricao)} size="small">
                      <VisibilityIcon />
                    </IconButton>
                  ) : row.detalhes_pagamento ? (
                    <IconButton onClick={() => handleOpenDetails(row.detalhes_pagamento)} size="small">
                      <VisibilityIcon />
                    </IconButton>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDetails} onClose={handleCloseDetails}>
        <DialogTitle>Detalhes do Pagamento</DialogTitle>
        <DialogContent>
          {selectedDetails && Object.entries(selectedDetails).map(([forma, valor]) => (
            <Typography key={forma}>{`${forma}: ${formatCurrency(valor)}`}</Typography>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MovimentacoesTable;