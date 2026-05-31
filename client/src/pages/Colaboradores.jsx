import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Menu,
  MenuItem,
  Checkbox,
  TablePagination,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Chip,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import { useSnackbar } from 'notistack';

function Colaboradores() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedColaborador, setSelectedColaborador] = useState(null);
  const [isConfirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyId, setCompanyId] = useState(null);

  useEffect(() => {
    const fetchCompanyId = async () => {
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();
        if (profile?.company_id) {
          setCompanyId(profile.company_id);
        }
      }
    };
    fetchCompanyId();
  }, [user]);

  useEffect(() => {
    if (companyId) {
      fetchColaboradores();
    }
  }, [companyId, searchTerm]);

  const fetchColaboradores = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      let query = supabase
        .from('colaboradores')
        .select('*')
        .eq('company_id', companyId);

      if (searchTerm) {
        query = query.ilike('nome', `%${searchTerm}%`);
      }

      const { data, error } = await query.order('created_at', { descending: true });

      if (error) throw error;
      setColaboradores(data);
    } catch (error) {
      enqueueSnackbar(`Erro ao buscar colaboradores: ${error.message}`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, colaborador) => {
    setAnchorEl(event.currentTarget);
    setSelectedColaborador(colaborador);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedColaborador(null);
  };

  const handleEdit = () => {
    if (selectedColaborador) {
      navigate(`/colaboradores/cadastro/${selectedColaborador.id}`);
    }
    handleMenuClose();
  };

  const handleDeleteColaborador = async () => {
    if (!selectedColaborador || !companyId) return;
    try {
      const { error } = await supabase
        .from('colaboradores')
        .delete()
        .match({ id: selectedColaborador.id, company_id: companyId });
      if (error) throw error;
      enqueueSnackbar('Colaborador excluído com sucesso!', { variant: 'success' });
      fetchColaboradores();
    } catch (error) {
      enqueueSnackbar(`Erro ao excluir colaborador: ${error.message}`, { variant: 'error' });
    }
    setConfirmDialogOpen(false);
    handleMenuClose();
  };

  const openConfirmDialog = () => {
    setConfirmDialogOpen(true);
  };

  const paginatedColaboradores = colaboradores.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={2} justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Grid item>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Colaboradores
          </Typography>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color="primary"
            component={RouterLink}
            to="/colaboradores/cadastro"
          >
            Novo Colaborador
          </Button>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Box sx={{ width: 300 }}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'primary.main', color: 'white' }}>
          <Typography variant="h6">Histórico de Colaboradores</Typography>
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox />
              </TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Função</TableCell>
              <TableCell>Comissão Padrão (%)</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : paginatedColaboradores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Nenhum colaborador encontrado
                </TableCell>
              </TableRow>
            ) : (
              paginatedColaboradores.map((colaborador) => (
                <TableRow key={colaborador.id}>
                  <TableCell padding="checkbox">
                    <Checkbox />
                  </TableCell>
                  <TableCell>{colaborador.nome}</TableCell>
                  <TableCell>{colaborador.funcao}</TableCell>
                  <TableCell>{colaborador.comissao_padrao}</TableCell>
                  <TableCell>
                    <Chip 
                      label={colaborador.status} 
                      color={colaborador.status === 'Ativo' ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={(e) => handleMenuOpen(e, colaborador)}>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={colaboradores.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Linhas por página:"
        />
      </TableContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>Editar</MenuItem>
        <MenuItem onClick={openConfirmDialog}>Excluir</MenuItem>
      </Menu>

      <Dialog
        open={isConfirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza de que deseja excluir o colaborador "{selectedColaborador?.nome}"? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDeleteColaborador} color="primary" autoFocus>
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Colaboradores;