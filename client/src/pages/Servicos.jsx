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
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import { useSnackbar } from 'notistack';

function Servicos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedServico, setSelectedServico] = useState(null);
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
      fetchServicos();
    }
  }, [companyId, searchTerm]); // Recarrega com a busca

  const fetchServicos = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      let query = supabase
        .from('servicos')
        .select(`
          *,
          categories ( name )
        `)
        .eq('company_id', companyId);

      if (searchTerm) {
        query = query.ilike('nome', `%${searchTerm}%`);
      }

      const { data, error } = await query.order('created_at', { descending: true });

      if (error) throw error;
      setServicos(data);
    } catch (error) {
      enqueueSnackbar(`Erro ao buscar serviços: ${error.message}`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, servico) => {
    setAnchorEl(event.currentTarget);
    setSelectedServico(servico);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedServico(null);
  };

  const handleEdit = () => {
    if (selectedServico) {
      navigate(`/servicos/cadastro/${selectedServico.id}`);
    }
    handleMenuClose();
  };

  const handleDeleteServico = async () => {
    if (!selectedServico || !companyId) return;
    try {
      const { error } = await supabase
        .from('servicos')
        .delete()
        .match({ id: selectedServico.id, company_id: companyId });
      if (error) throw error;
      enqueueSnackbar('Serviço excluído com sucesso!', { variant: 'success' });
      fetchServicos(); // Atualiza a lista
    } catch (error) {
      enqueueSnackbar(`Erro ao excluir serviço: ${error.message}`, { variant: 'error' });
    }
    setConfirmDialogOpen(false);
    handleMenuClose();
  };

  const openConfirmDialog = () => {
    setConfirmDialogOpen(true);
  };

  const paginatedServicos = servicos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={2} justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Grid item>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Serviços
          </Typography>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color="primary"
            component={RouterLink}
            to="/servicos/cadastro"
          >
            Novo Serviço
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
          <Typography variant="h6">Histórico de Serviços</Typography>
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox />
              </TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Duração (min)</TableCell>
              <TableCell>Categoria</TableCell>
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
            ) : paginatedServicos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Nenhum serviço encontrado
                </TableCell>
              </TableRow>
            ) : (
              paginatedServicos.map((servico) => (
                <TableRow key={servico.id}>
                  <TableCell padding="checkbox">
                    <Checkbox />
                  </TableCell>
                  <TableCell>{servico.nome}</TableCell>
                  <TableCell>{`R$ ${servico.valor}`}</TableCell>
                  <TableCell>{servico.duracao}</TableCell>
                  <TableCell>{servico.categories?.name || 'Sem categoria'}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={(e) => handleMenuOpen(e, servico)}>
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
          count={servicos.length}
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
            Tem certeza de que deseja excluir o serviço "{selectedServico?.nome}"? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDeleteServico} color="primary" autoFocus>
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Servicos;