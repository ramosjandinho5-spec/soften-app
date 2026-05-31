import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Typography,
  Box,
  IconButton,
  useTheme,
  useMediaQuery,
  Grid,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';

function ListaClientes({ onEditar, onExcluir, onToggleStatus, termoBusca }) {
  const { user } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchClientes = async () => {
      if (!user) return;
      try {
        setLoading(true);

        // 1. Buscar o company_id do perfil do usuário
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        
        const companyId = profile?.company_id;
        if (!companyId) {
          setClientes([]);
          return;
        }

        // 2. Usar o company_id para buscar os clientes
        let query = supabase.from('clientes').select('*').eq('company_id', companyId);

        if (termoBusca) {
          query = query.ilike('nome', `%${termoBusca}%`);
        } else {
          query = query.eq('status', 'ativo');
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setClientes(data);
      } catch (error) {
        console.error('Erro ao buscar clientes:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClientes();
  }, [termoBusca, user]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {isMobile ? (
        <Grid container spacing={2}>
          {clientes.length === 0 ? (
            <Grid item xs={12}>
              <Typography align="center" sx={{ p: 2 }}>Nenhum cliente ativo encontrado.</Typography>
            </Grid>
          ) : (
            clientes.map((cliente) => (
              <Grid item xs={12} key={cliente.id}>
                <Paper sx={{ p: 2 }}>
                  <Grid container justifyContent="space-between" alignItems="flex-start">
                    <Grid item xs>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{cliente.nome}</Typography>
                      <Typography variant="body2" color="text.secondary">{cliente.cnpj_cpf}</Typography>
                      <Typography variant="body2" color="text.secondary">{cliente.email}</Typography>
                      <Typography variant="body2" color="text.secondary">{cliente.telefone}</Typography>
                    </Grid>
                    <Grid item>
                      <IconButton size="small" onClick={() => onEditar(cliente)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => onExcluir(cliente)} sx={{ '&:hover': { color: 'error.light' } }}>
                        <DeleteIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => onToggleStatus(cliente.id, cliente.status)}>
                        {cliente.status === 'ativo' ? <ToggleOnIcon color="success" /> : <ToggleOffIcon color="action" />}
                      </IconButton>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            ))
          )}
        </Grid>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="tabela de clientes">
            <TableHead sx={{ backgroundColor: '#F4F6F8' }}>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>CNPJ/CPF</TableCell>
                <TableCell>E-mail</TableCell>
                <TableCell>Telefone</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography sx={{ p: 2 }}>Nenhum cliente ativo encontrado.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                clientes.map((cliente) => (
                  <TableRow
                    key={cliente.id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {cliente.nome}
                    </TableCell>
                    <TableCell>{cliente.cnpj_cpf}</TableCell>
                    <TableCell>{cliente.email}</TableCell>
                    <TableCell>{cliente.telefone}</TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => onEditar(cliente)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => onExcluir(cliente)}
                        sx={{ 
                          '&:hover': { 
                            color: 'error.light' 
                          } 
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => onToggleStatus(cliente.id, cliente.status)}>
                        {cliente.status === 'ativo' ? (
                          <ToggleOnIcon color="success" />
                        ) : (
                          <ToggleOffIcon color="action" />
                        )}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default ListaClientes;