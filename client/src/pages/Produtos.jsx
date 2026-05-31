import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Breadcrumbs,
  Link,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TablePagination,
  Checkbox,
  Menu,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useTheme,
  useMediaQuery,
  Grid
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import MoreVertIcon from '@mui/icons-material/MoreVert'; // Importa o ícone
import { supabase } from '../supabaseClient'; // Importa o Supabase
import { useAuth } from '../contexts/AuthContext';

import { useNavigate } from 'react-router-dom';

function Produtos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isConfirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleOpenConfirmDialog = () => {
    setConfirmDialogOpen(true);
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
  };

  const handleMenuOpen = (event, product) => {
    setAnchorEl(event.currentTarget);
    setSelectedProduct(product);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProduct(null);
  };

  const handleEdit = () => {
    if (selectedProduct) {
      navigate(`/produtos/cadastro/${selectedProduct.id}`);
    }
    handleMenuClose();
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    try {
      const { error } = await supabase
        .from('produtos')
        .delete()
        .match({ id: selectedProduct.id });

      if (error) {
        throw error;
      }
      setProducts(products.filter(p => p.id !== selectedProduct.id));
      handleMenuClose();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
    }
  };

  const handleToggleActive = async () => {
    if (!selectedProduct) return;
    try {
      const { data, error } = await supabase
        .from('produtos')
        .update({ is_active: !selectedProduct.is_active })
        .match({ id: selectedProduct.id })
        .select()
        .single();

      if (error) {
        throw error;
      }
      setProducts(products.map(p => (p.id === selectedProduct.id ? data : p)));
      handleMenuClose();
    } catch (error) {
      console.error('Erro ao inativar/ativar produto:', error);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [searchTerm, user]); // Adiciona searchTerm e user como dependência

  const fetchProducts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Buscar o company_id do perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      
      const companyId = profile?.company_id;
      if (!companyId) {
        setProducts([]);
        return;
      }

      // 2. Usar o company_id para buscar os produtos
      let query = supabase.from('produtos').select('*').eq('company_id', companyId);

      if (searchTerm) {
        // Busca por múltiplos campos usando 'or'
        query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`);
      } else {
        // Por padrão, mostra apenas produtos ativos
        query = query.eq('is_active', true);
      }

      const { data, error } = await query.order('created_at', { descending: true });

      if (error) {
        throw error;
      }
      setProducts(data);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={2} justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Grid item>
          <Typography variant="h4" sx={{ fontWeight: 'bold', fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
            Produtos
          </Typography>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color="primary"
            component={RouterLink}
            to="/produtos/cadastro"
          >
            Novo Produto
          </Button>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
      <Box sx={{ width: 300 }}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Busca por nome, SKU ou código de barras..."
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

      {isMobile ? (
        <Box>
          {loading ? (
            <Typography align="center">Carregando...</Typography>
          ) : products.length === 0 ? (
            <Typography align="center">Nenhum registro foi encontrado</Typography>
          ) : (
            products
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((product) => (
                <Paper key={product.id} sx={{ p: 2, mb: 2, textDecoration: product.is_active ? 'none' : 'line-through', color: product.is_active ? 'inherit' : 'text.secondary' }}>
                  <Grid container justifyContent="space-between" alignItems="center">
                    <Grid item>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{product.name}</Typography>
                    </Grid>
                    <Grid item>
                      <IconButton onClick={(e) => handleMenuOpen(e, product)}>
                        <MoreVertIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                  <Typography variant="body2"><strong>Cód. Barras:</strong> {product.barcode || '-'}</Typography>
                  <Typography variant="body2"><strong>SKU:</strong> {product.sku || '-'}</Typography>
                  <Typography variant="body2"><strong>Vl. Venda:</strong> {`R$ ${product.sale_price}`}</Typography>
                </Paper>
              ))
          )}
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'primary.main', color: 'white' }}>
              <Typography variant="h6">Produtos</Typography>
              <IconButton color="inherit">
                  <ViewColumnIcon />
              </IconButton>
          </Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox />
                </TableCell>
                <TableCell>Cód. de barras</TableCell>
                <TableCell>Cód. SKU</TableCell>
                <TableCell>Nome</TableCell>
                <TableCell>Unid.</TableCell>
                <TableCell>Vl. Venda</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Nenhum registro foi encontrado
                  </TableCell>
                </TableRow>
              ) : (
                products
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((product) => (
                    <TableRow 
                      key={product.id}
                      sx={{
                        '& .MuiTableCell-root': {
                          textDecoration: product.is_active ? 'none' : 'line-through',
                          color: product.is_active ? 'inherit' : 'text.secondary',
                        },
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox />
                      </TableCell>
                      <TableCell>{product.barcode}</TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.measurement_unit}</TableCell>
                      <TableCell>{`R$ ${product.sale_price}`}</TableCell>
                      <TableCell align="right">
                        <IconButton onClick={(e) => handleMenuOpen(e, product)}>
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>Editar</MenuItem>
        <MenuItem onClick={handleToggleActive}>
          {selectedProduct?.is_active ? 'Inativar' : 'Ativar'}
        </MenuItem>
        <MenuItem onClick={handleOpenConfirmDialog}>Excluir</MenuItem>
      </Menu>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={products.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Linhas por página:"
      />

      <Dialog
        open={isConfirmDialogOpen}
        onClose={handleCloseConfirmDialog}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Você tem certeza que deseja excluir o produto "{selectedProduct?.name}"? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Cancelar</Button>
          <Button onClick={handleDeleteProduct} color="error">Excluir</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Produtos;