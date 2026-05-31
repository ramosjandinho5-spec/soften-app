import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  Breadcrumbs,
  Link,
  InputAdornment,
  IconButton,
  CircularProgress,
  Autocomplete
} from '@mui/material';
import { Link as RouterLink, useParams, useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { useSnackbar } from 'notistack';
import { useAuth } from '../contexts/AuthContext';
import CategoryModal from '../components/CategoryModal';
import { supabase } from '../supabaseClient';

const COSMOS_API_TOKEN = 'iLbjRFXNDUiD7ZvdQ91llQ'; // <-- COLOQUE SEU TOKEN DA COSMOS AQUI

function CadastroProduto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [productData, setProductData] = useState(null); // Dados da API Cosmos
  const [loading, setLoading] = useState(false);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [companyId, setCompanyId] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  // Estado unificado para o formulário do produto
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    brand: '',
    supplier: '',
    measurement_unit: '',
    cost_price: '',
    sale_price: '',
    margin: '',
    category_id: null,
    barcode: '',
    is_active: true, // Garante que o produto seja ativo por padrão
  });

  // Efeito para calcular o valor de venda automaticamente
  useEffect(() => {
    const cost = parseFloat(productForm.cost_price);
    const marginPercent = parseFloat(productForm.margin);

    if (!isNaN(cost) && !isNaN(marginPercent) && marginPercent >= 0) {
      const salePrice = cost * (1 + marginPercent / 100);
      setProductForm((prev) => ({
        ...prev,
        sale_price: salePrice.toFixed(2),
      }));
    }
  }, [productForm.cost_price, productForm.margin]);

  // Função para lidar com a mudança nos campos do formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({ ...prev, [name]: value }));
  };

  // Função para lidar com a mudança na categoria (Autocomplete)
  const handleCategoryChange = (event, newValue) => {
    setProductForm((prev) => ({
      ...prev,
      category_id: newValue ? newValue.id : null,
    }));
  };

  useEffect(() => {
    const fetchCompanyId = async () => {
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // Ignore "no rows" error
          console.error('Erro ao buscar company_id:', error);
          // Fallback to user_id if company_id is not found for any reason
          setCompanyId(user.id);
        } else if (profile && profile.company_id) {
          setCompanyId(profile.company_id);
        } else {
          // Fallback to user_id if profile exists but company_id is null or not found
          setCompanyId(user.id);
        }
      }
    };

    fetchCompanyId();
  }, [user]);

  useEffect(() => {
    if (companyId) {
      fetchCategories();
    }
  }, [companyId]);

  useEffect(() => {
    const fetchProduct = async () => {
      // Only fetch product if we have an ID, categories, and companyId
      if (id && categories.length > 0 && companyId) {
        setLoading(true);
        try {
          const { data: productData, error } = await supabase
            .from('produtos')
            .select('*')
            .match({ id: id, company_id: companyId }) // Security fix: Match company_id
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116: no rows found, which is ok
            throw error;
          }
          
          if (!productData) {
            enqueueSnackbar('Produto não encontrado ou não pertence à sua empresa!', { variant: 'error' });
            navigate('/produtos');
            return;
          }

          if (productData) {
            setProductForm(productData);
          }
        } catch (error) {
          console.error('Erro ao buscar produto:', error.message);
          enqueueSnackbar(`Erro ao buscar produto: ${error.message}`, { variant: 'error' });
        } finally {
          setLoading(false);
        }
      }
    };

    if (user) {
      fetchProduct();
    }
  }, [id, user, categories, companyId, navigate, enqueueSnackbar]); // Add 'companyId' to dependency array

  const fetchCategories = async () => {
    if (!companyId) return;
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('company_id', companyId)
        .eq('type', 'produto');
      if (error) {
        throw error;
      }
      setCategories(data);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      enqueueSnackbar(`Erro ao buscar categorias: ${error.message}`, { variant: 'error' });
    }
  };

  const handleOpenCategoryModal = () => setCategoryModalOpen(true);
  const handleCloseCategoryModal = () => setCategoryModalOpen(false);

  const handleSaveCategory = async (newCategory) => {
    if (!companyId) {
      enqueueSnackbar('ID da empresa não encontrado. Não é possível salvar a categoria.', { variant: 'error' });
      return;
    }
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ 
          name: newCategory.name, 
          description: newCategory.description,
          company_id: companyId,
          type: 'produto'
        }])
        .select();

      if (error) {
        throw error;
      }

      enqueueSnackbar(`Categoria "${newCategory.name}" salva com sucesso!`, { variant: 'success' });
      fetchCategories(); // Atualiza a lista de categorias
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      enqueueSnackbar(`Erro ao salvar categoria: ${error.message}`, { variant: 'error' });
    }
  };

  const handleSearch = async () => {
    if (COSMOS_API_TOKEN === 'SEU_TOKEN_AQUI') {
      enqueueSnackbar('Por favor, adicione seu Token da API Cosmos no código.', { variant: 'error' });
      return;
    }
    if (!productForm.barcode) {
      enqueueSnackbar('Por favor, insira um código de barras.', { variant: 'warning' });
      return;
    }
    setLoading(true);
    setProductData(null);
    try {
      const response = await fetch(`https://api.cosmos.bluesoft.com.br/gtins/${productForm.barcode}`, {
        headers: {
          'X-Cosmos-Token': COSMOS_API_TOKEN,
        },
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          enqueueSnackbar('Produto não encontrado na base de dados da Cosmos.', { variant: 'error' });
        } else {
          throw new Error(`Erro na API: ${response.statusText}`);
        }
      } else {
        const data = await response.json();
        setProductData(data);
        enqueueSnackbar('Produto encontrado!', { variant: 'success' });
      }

    } catch (error) {
      console.error('Erro ao buscar dados do produto:', error);
      enqueueSnackbar('Falha ao buscar dados do produto. Verifique o console.', { variant: 'error' });
    }
    setLoading(false);
  };

  const handleSaveProduct = async () => {
    if (!companyId) {
      enqueueSnackbar('ID da empresa não encontrado. Não é possível salvar o produto.', { variant: 'error' });
      return;
    }

    try {
      let error;
      const productPayload = { ...productForm, company_id: companyId };

      if (id) {
        // Modo de Edição: Update
        const { id: productId, created_at, ...updateData } = productPayload;
        const { error: updateError } = await supabase
          .from('produtos')
          .update(updateData)
          .match({ id: id, company_id: companyId }); // Security: ensure we only update our own product
        error = updateError;
      } else {
        // Modo de Criação: Insert
        const { error: insertError } = await supabase
          .from('produtos')
          .insert([productPayload]);
        error = insertError;
      }

      if (error) {
        throw error;
      }

      enqueueSnackbar(`Produto ${id ? 'atualizado' : 'salvo'} com sucesso!`, { variant: 'success' });
      navigate('/produtos'); // Redireciona para a lista de produtos

    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      enqueueSnackbar(`Erro ao salvar produto: ${error.message}`, { variant: 'error' });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        {id ? 'Editar Produto' : 'Novo Produto'}
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Informações básicas
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Código de barra"
              name="barcode"
              value={productForm.barcode}
              onChange={handleInputChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleSearch} disabled={loading}>
                      {loading ? <CircularProgress size={24} /> : <SearchIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Nome do produto"
              name="name"
              value={productForm.name}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Código SKU"
              name="sku"
              value={productForm.sku}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Marca"
              name="brand"
              value={productForm.brand}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Fornecedor"
              name="supplier"
              value={productForm.supplier}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Unidade de medida"
              name="measurement_unit"
              value={productForm.measurement_unit}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              fullWidth
              options={categories}
              getOptionLabel={(option) => option.name || ''}
              value={categories.find(cat => cat.id === productForm.category_id) || null}
              onChange={handleCategoryChange}
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Categorias"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {params.InputProps.endAdornment}
                        <IconButton onClick={handleOpenCategoryModal} disabled={!companyId}>
                          <AddIcon />
                        </IconButton>
                      </>
                    ),
                  }}
                />
              )}
            />
          </Grid>
        </Grid>

        <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
          Preços
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Valor de Custo"
              name="cost_price"
              value={productForm.cost_price}
              onChange={handleInputChange}
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Margem de Venda"
              name="margin"
              value={productForm.margin}
              onChange={handleInputChange}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Valor de Venda"
              name="sale_price"
              value={productForm.sale_price}
              onChange={handleInputChange}
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" color="primary" onClick={() => navigate('/produtos')}>
            Cancelar
          </Button>
          <Button variant="contained" color="primary" onClick={handleSaveProduct} disabled={!companyId}>
            {id ? 'Atualizar' : 'Salvar'}
          </Button>
        </Box>
      </Paper>

      <CategoryModal
        open={isCategoryModalOpen}
        onClose={handleCloseCategoryModal}
        onSave={handleSaveCategory}
      />
    </Box>
  );
}

export default CadastroProduto;