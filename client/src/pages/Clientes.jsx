import React, { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useSnackbar } from 'notistack';
import CadastroCliente from '../components/CadastroCliente';
import ListaClientes from '../components/ListaClientes';
import ConfirmDialog from '../components/ConfirmDialog';
import { Typography, Button, Box, Paper, TableContainer, IconButton, Breadcrumbs, Link, TextField, InputAdornment, useTheme, useMediaQuery, Grid } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import { Link as RouterLink } from 'react-router-dom';

function Clientes() {
  const [view, setView] = useState('list'); // 'list' ou 'form'
  const [refreshKey, setRefreshKey] = useState(0);
  const [clienteParaEditar, setClienteParaEditar] = useState(null);
  const [clienteParaExcluir, setClienteParaExcluir] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const { enqueueSnackbar } = useSnackbar();

  const handleCadastroSucesso = useCallback(() => {
    setView('list');
    setClienteParaEditar(null); // Limpa o cliente após o sucesso
    setRefreshKey(oldKey => oldKey + 1);
  }, []);

  const handleCancel = () => {
    setView('list');
    setClienteParaEditar(null); // Limpa o cliente ao cancelar
  };

  const handleEditarCliente = (cliente) => {
    setClienteParaEditar(cliente);
    setView('form');
  };

  const handleExcluirClick = (cliente) => {
    setClienteParaExcluir(cliente);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setClienteParaExcluir(null);
    setDialogOpen(false);
  };

  const handleConfirmExcluir = async () => {
    if (!clienteParaExcluir) return;

    try {
      // Adiciona .select() para obter o count de linhas afetadas
      const { error, count } = await supabase
        .from('clientes')
        .delete()
        .eq('id', clienteParaExcluir.id);

      if (error) {
        throw new Error(error.message);
      }

      // Verifica se a exclusão realmente aconteceu no banco de dados
      if (count === 0) {
        throw new Error("A exclusão falhou no banco de dados. Verifique as permissões (RLS).");
      }

      enqueueSnackbar('Cliente excluído com sucesso!', { variant: 'success' });
      setRefreshKey(oldKey => oldKey + 1); // Atualiza a lista
    } catch (error) {
      enqueueSnackbar(`Erro ao excluir cliente: ${error.message}`, { variant: 'error' });
    } finally {
      handleCloseDialog();
    }
  };

  const handleToggleStatus = async (clienteId, currentStatus) => {
    const novoStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';
    try {
      const { error } = await supabase
        .from('clientes')
        .update({ status: novoStatus })
        .eq('id', clienteId);

      if (error) throw error;

      enqueueSnackbar(`Cliente ${novoStatus === 'ativo' ? 'ativado' : 'inativado'} com sucesso!`, { variant: 'success' });
      setRefreshKey(oldKey => oldKey + 1);
    } catch (error) {
      enqueueSnackbar('Erro ao alterar status do cliente: ' + error.message, { variant: 'error' });
    }
  };

  if (view === 'form') {
    return (
      <CadastroCliente
        clienteParaEditar={clienteParaEditar}
        onCadastroSucesso={handleCadastroSucesso}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <ConfirmDialog
        open={dialogOpen}
        title="Confirmar Exclusão"
        message={`Você tem certeza que deseja excluir o cliente \"${clienteParaExcluir?.nome}\"? Esta ação não pode ser desfeita.`}
        onConfirm={handleConfirmExcluir}
        onCancel={handleCloseDialog}
      />

      <Grid container spacing={2} justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Grid item>
          <Typography variant="h4" sx={{ fontWeight: 'bold', fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
            Clientes
          </Typography>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setView('form')}
          >
            Novo Cliente
          </Button>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <TextField
                variant="outlined"
                size="small"
                placeholder="Digite aqui a sua busca"
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                InputProps={{
                    endAdornment: (
                    <InputAdornment position="end">
                        <IconButton>
                        <SearchIcon />
                        </IconButton>
                    </InputAdornment>
                    ),
                }}
            />
        </Box>
      </Paper>
      
      <TableContainer component={Paper}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'primary.main', color: 'white' }}>
            <Typography variant="h6">Clientes</Typography>
            <IconButton color="inherit">
                <ViewColumnIcon />
            </IconButton>
        </Box>
        <ListaClientes
          key={refreshKey}
          termoBusca={termoBusca}
          onEditar={handleEditarCliente}
          onExcluir={handleExcluirClick}
          onToggleStatus={handleToggleStatus}
        />
      </TableContainer>
    </Box>
  );
}

export default Clientes;