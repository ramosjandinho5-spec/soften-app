import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Divider,
    InputAdornment,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { supabase } from '../supabaseClient';
import { useSnackbar } from 'notistack';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function NovoOrcamento() {
  const { user } = useAuth();
  const { id: orcamentoId } = useParams();
  const [isEditMode, setIsEditMode] = useState(!!orcamentoId);
  const [loading, setLoading] = useState(false);

  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [selectedVendedor, setSelectedVendedor] = useState(null);
  const [selectedProduto, setSelectedProduto] = useState(null);
  const [itensOrcamento, setItensOrcamento] = useState([]);
  const [orcamentoToDelete, setOrcamentoToDelete] = useState(null);
  
    const [subtotal, setSubtotal] = useState(0);
  const [descontoPercent, setDescontoPercent] = useState(0);
  const [descontoReais, setDescontoReais] = useState(0);
  const [acrescimoReais, setAcrescimoReais] = useState(0);
  const [totalOrcamento, setTotalOrcamento] = useState(0);
  
  const [openNewClientModal, setOpenNewClientModal] = useState(false);
  const [newClient, setNewClient] = useState({ nome: '', cnpj_cpf: '' });

  const [companyId, setCompanyId] = useState(null);

  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCompanyId = async () => {
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao buscar company_id:', error);
        } else if (profile && profile.company_id) {
          setCompanyId(profile.company_id);
        } else {
          enqueueSnackbar('Nenhuma empresa ativa selecionada. Redirecionando...', { variant: 'warning' });
          navigate('/trocar-empresa');
        }
      }
    };
    fetchCompanyId();
  }, [user, navigate, enqueueSnackbar]);

  const fetchInitialData = useCallback(async () => {
    if (!companyId) return;

    const { data: clientesData, error: clientesError } = await supabase
      .from('clientes')
      .select('id, nome, rua, numero, bairro, cidade, estado, cep')
      .eq('company_id', companyId);

    if (clientesError) {
      enqueueSnackbar('Falha ao carregar os clientes.', { variant: 'error' });
    } else {
      setClientes(clientesData);
    }

    const { data: produtosData, error: produtosError } = await supabase
      .from('produtos')
      .select('id, name, sale_price')
      .eq('is_active', true)
      .eq('company_id', companyId);

    if (produtosError) {
      enqueueSnackbar('Falha ao carregar os produtos.', { variant: 'error' });
    } else {
      setProdutos(produtosData);
    }

    const { data: vendedoresData, error: vendedoresError } = await supabase
      .from('colaboradores')
      .select('id, nome')
      .eq('company_id', companyId);

    if (vendedoresError) {
      console.error('Erro ao buscar vendedores:', vendedoresError);
      enqueueSnackbar('Falha ao carregar os vendedores.', { variant: 'error' });
    } else {
      setVendedores(vendedoresData);
    }
  }, [companyId, enqueueSnackbar]);

  const loadOrcamentoData = useCallback(async () => {
    if (!orcamentoId) return;
    setLoading(true);

    const { data: orcamentoData, error: orcamentoError } = await supabase
      .from('orcamentos')
      .select('*, clientes(*), colaboradores(*)')
      .eq('id', orcamentoId)
      .eq('company_id', companyId)
      .single();

    if (orcamentoError || !orcamentoData) {
      enqueueSnackbar('Erro ao carregar dados do orçamento.', { variant: 'error' });
      console.error('Erro ao carregar orçamento:', orcamentoError);
      navigate('/orcamentos');
      return;
    }

    const { data: itensData, error: itensError } = await supabase
      .from('orcamento_itens')
      .select('*, produtos(*)')
      .eq('orcamento_id', orcamentoId);

    if (itensError) {
      enqueueSnackbar('Erro ao carregar itens do orçamento.', { variant: 'error' });
      setLoading(false);
      return;
    }

        setSelectedCliente(orcamentoData.clientes);
    setDescontoReais(orcamentoData.desconto || 0);
    setAcrescimoReais(orcamentoData.acrescimo || 0);

    const subtotalCalculado = itensData.reduce((acc, item) => acc + item.subtotal, 0);
    if (subtotalCalculado > 0) {
      const percent = (orcamentoData.desconto / subtotalCalculado) * 100;
      setDescontoPercent(percent.toFixed(2));
    }
    
    const itensFormatados = itensData
      .filter(item => item.produtos) // Garante que o produto não é nulo
      .map(item => ({
        ...item.produtos, // Traz todos os dados do produto (id, name, preco, etc)
        quantidade: item.quantidade,
        preco: item.preco_unitario, // Usa o preço que foi salvo no orçamento
        subtotal: item.subtotal,
    }));
    
    setItensOrcamento(itensFormatados);
    setSelectedVendedor(orcamentoData.colaboradores);
    setLoading(false);
  }, [orcamentoId, companyId, enqueueSnackbar, navigate]);

  useEffect(() => {
    if (companyId) {
      fetchInitialData();
      if (isEditMode) {
        loadOrcamentoData();
      }
    }
  }, [companyId, isEditMode, fetchInitialData, loadOrcamentoData]);

    const calcularTotais = useCallback(() => {
    const sub = itensOrcamento.reduce((acc, item) => acc + (item.quantidade * item.preco), 0);
    setSubtotal(sub);
    const dr = parseFloat(descontoReais) || 0;
    const ar = parseFloat(acrescimoReais) || 0;
    const total = sub - dr + ar;
    setTotalOrcamento(total > 0 ? total : 0);
  }, [itensOrcamento, descontoReais, acrescimoReais]);

  useEffect(() => {
    calcularTotais();
  }, [calcularTotais]);

  const handleDescontoPercentChange = (e) => {
    const percent = parseFloat(e.target.value) || 0;
    setDescontoPercent(percent);
    if (subtotal > 0) {
      const reais = (subtotal * percent) / 100;
      setDescontoReais(reais.toFixed(2));
    }
  };

  const handleDescontoReaisChange = (e) => {
    const reais = parseFloat(e.target.value) || 0;
    setDescontoReais(reais);
    if (subtotal > 0) {
      const percent = (reais / subtotal) * 100;
      setDescontoPercent(percent.toFixed(2));
    }
  };

  const handleAddProduto = () => {
    if (!selectedProduto) return;
    const isAlreadyInCart = itensOrcamento.find(item => item.id === selectedProduto.id);
    if (isAlreadyInCart) {
        enqueueSnackbar('Este produto já foi adicionado.', { variant: 'info' });
        return;
    }
    const newItem = {
      id: selectedProduto.id,
      name: selectedProduto.name,
      quantidade: 1,
      preco: selectedProduto.sale_price || 0,
    };
    setItensOrcamento([...itensOrcamento, newItem]);
    setSelectedProduto(null);
  };
  
  const handleItemChange = (id, field, value) => {
    const newItens = itensOrcamento.map(item => {
        if (item.id === id) {
            const val = parseFloat(value);
            return { ...item, [field]: val >= 0 ? val : 0 };
        }
        return item;
    });
    setItensOrcamento(newItens);
  };

  const handleRemoveItem = (id) => {
    setItensOrcamento(itensOrcamento.filter(item => item.id !== id));
  };

  const handleSave = async () => {
    if (!selectedCliente) {
      enqueueSnackbar('Selecione um cliente.', { variant: 'warning' });
      return;
    }
    if (itensOrcamento.length === 0) {
      enqueueSnackbar('Adicione pelo menos um item ao orçamento.', { variant: 'warning' });
      return;
    }

    setLoading(true);

    const orcamentoData = {
      cliente_id: selectedCliente.id,
      vendedor_id: selectedVendedor ? selectedVendedor.id : null,
      company_id: companyId,
      subtotal: subtotal,
      desconto: descontoReais,
      acrescimo: acrescimoReais,
      valor_total: totalOrcamento,
      status: 'Pendente',
    };

    if (isEditMode) {
      // ATUALIZAR ORÇAMENTO
      const { error: updateError } = await supabase
        .from('orcamentos')
        .update(orcamentoData)
        .eq('id', orcamentoId);

      if (updateError) {
        enqueueSnackbar('Erro ao atualizar o orçamento.', { variant: 'error' });
        console.error('Erro:', updateError);
        setLoading(false);
        return;
      }

      // Deletar itens antigos para simplificar (poderia ser mais otimizado)
      await supabase.from('orcamento_itens').delete().eq('orcamento_id', orcamentoId);

      // Inserir novos itens
      const itensToInsert = itensOrcamento.map(item => ({
        orcamento_id: orcamentoId,
        produto_id: item.id,
        quantidade: item.quantidade,
        preco_unitario: item.preco,
        subtotal: item.quantidade * item.preco,
      }));

      const { error: itensInsertError } = await supabase
        .from('orcamento_itens')
        .insert(itensToInsert);

      if (itensInsertError) {
        enqueueSnackbar('Erro ao atualizar os itens do orçamento.', { variant: 'error' });
        console.error('Erro:', itensInsertError);
      } else {
        enqueueSnackbar('Orçamento atualizado com sucesso!', { variant: 'success' });
        navigate('/orcamentos');
      }

    } else {
      // CRIAR NOVO ORÇAMENTO
      const { data: newOrcamento, error: insertError } = await supabase
        .from('orcamentos')
        .insert(orcamentoData)
        .select()
        .single();

      if (insertError) {
        enqueueSnackbar('Erro ao salvar o orçamento.', { variant: 'error' });
        console.error('Erro:', insertError);
        setLoading(false);
        return;
      }

      const itensToInsert = itensOrcamento.map(item => ({
        orcamento_id: newOrcamento.id,
        produto_id: item.id,
        quantidade: item.quantidade,
        preco_unitario: item.preco,
        subtotal: item.quantidade * item.preco,
      }));

      const { error: itensInsertError } = await supabase
        .from('orcamento_itens')
        .insert(itensToInsert);

      if (itensInsertError) {
        enqueueSnackbar('Erro ao salvar os itens do orçamento.', { variant: 'error' });
        console.error('Erro:', itensInsertError);
      } else {
        enqueueSnackbar('Orçamento salvo com sucesso!', { variant: 'success' });
        navigate('/orcamentos');
      }
    }
    setLoading(false);
  };

    const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSaveNewClient = async () => {
    if (!companyId) {
        enqueueSnackbar('ID da empresa não encontrado.', { variant: 'error' });
        return;
    }
    if (!newClient.nome || !newClient.cnpj_cpf) {
        enqueueSnackbar('Preencha o nome e o CNPJ/CPF.', { variant: 'warning' });
        return;
    }

    const { data, error } = await supabase
        .from('clientes')
        .insert([{ ...newClient, company_id: companyId }])
        .select();

    if (error) {
        enqueueSnackbar('Erro ao cadastrar cliente: ' + error.message, { variant: 'error' });
    } else {
        enqueueSnackbar('Cliente cadastrado com sucesso!', { variant: 'success' });
        const novoClienteCadastrado = data[0];
        setClientes(prev => [...prev, novoClienteCadastrado]);
        setSelectedCliente(novoClienteCadastrado);
        setOpenNewClientModal(false);
        setNewClient({ nome: '', cnpj_cpf: '' });
    }
  };

  const renderItens = () => {
    if (isMobile) {
      return (
        <Box>
          {itensOrcamento.map((item) => (
            <Paper key={item.id} sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{item.name}</Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={6}>
                  <TextField
                    label="Qtd."
                    type="number"
                    value={item.quantidade}
                    onChange={(e) => handleItemChange(item.id, 'quantidade', e.target.value)}
                    fullWidth
                    size="small"
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Preço Unit."
                    type="number"
                    value={item.preco}
                    onChange={(e) => handleItemChange(item.id, 'preco', e.target.value)}
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    }}
                  />
                </Grid>
              </Grid>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                <Typography variant="body1">
                  Subtotal: <strong>R$ {(item.quantidade * item.preco).toFixed(2)}</strong>
                </Typography>
                <IconButton onClick={() => handleRemoveItem(item.id)} color="error">
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Paper>
          ))}
        </Box>
      );
    }

    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Produto</TableCell>
              <TableCell>Qtd.</TableCell>
              <TableCell>Preço Unit.</TableCell>
              <TableCell>Subtotal</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {itensOrcamento.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    value={item.quantidade}
                    onChange={(e) => handleItemChange(item.id, 'quantidade', e.target.value)}
                    size="small"
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    value={item.preco}
                    onChange={(e) => handleItemChange(item.id, 'preco', e.target.value)}
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    }}
                  />
                </TableCell>
                <TableCell>R$ {(item.quantidade * item.preco).toFixed(2)}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleRemoveItem(item.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: { xs: 2, sm: 0 }, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          {isEditMode ? 'Editar Orçamento' : 'Novo Orçamento'}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={loading}
        >
          {isEditMode ? 'Atualizar Orçamento' : 'Salvar Orçamento'}
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Itens do Orçamento</Typography>
            <Grid container spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <Grid item xs={12} sm>
                <Autocomplete
                  fullWidth
                  options={produtos}
                  getOptionLabel={(option) => option.name || ''}
                  value={selectedProduto}
                  onChange={(event, newValue) => setSelectedProduto(newValue)}
                  renderInput={(params) => <TextField {...params} label="Buscar produto" />}
                />
              </Grid>
              <Grid item xs={12} sm="auto">
                <Button fullWidth variant="contained" onClick={handleAddProduto}>Adicionar</Button>
              </Grid>
            </Grid>
            {renderItens()}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Resumo do Orçamento</Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Autocomplete
                      fullWidth
                      options={clientes}
                      getOptionLabel={(option) => option.nome || ''}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      value={selectedCliente}
                      onChange={(event, newValue) => setSelectedCliente(newValue)}
                      renderInput={(params) => <TextField {...params} label="Buscar cliente" />}
                    />
                <IconButton color="primary" onClick={() => setOpenNewClientModal(true)}>
                    <AddIcon />
                </IconButton>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Autocomplete
                    fullWidth
                    options={vendedores}
                    getOptionLabel={(option) => option.nome || ''}
                    value={selectedVendedor}
                    onChange={(event, newValue) => setSelectedVendedor(newValue)}
                    renderInput={(params) => <TextField {...params} label="Vendedor" />}
                />
            </Box>
            {selectedCliente && (
              <Box sx={{ mb: 2, fontSize: '0.875rem', color: 'text.secondary' }}>
                <Typography variant="body2">{`${selectedCliente.rua || ''}, ${selectedCliente.numero || ''}`}</Typography>
                <Typography variant="body2">{`${selectedCliente.bairro || ''}, ${selectedCliente.cidade || ''} - ${selectedCliente.estado || ''}`}</Typography>
                <Typography variant="body2">{`CEP: ${selectedCliente.cep || ''}`}</Typography>
              </Box>
            )}
            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Subtotal</Typography>
              <Typography>R$ {subtotal.toFixed(2)}</Typography>
            </Box>

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                <TextField
                  label="Desconto (%)"
                  type="number"
                  fullWidth
                  value={descontoPercent}
                  onChange={handleDescontoPercentChange}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Desconto (R$)"
                  type="number"
                  fullWidth
                  value={descontoReais}
                  onChange={handleDescontoReaisChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>

            <TextField
              label="Acréscimo (R$)"
              type="number"
              fullWidth
              value={acrescimoReais}
              onChange={(e) => setAcrescimoReais(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
              sx={{ my: 2 }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h5">Total:</Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                R$ {totalOrcamento.toFixed(2)}
              </Typography>
            </Box>
            

          </Paper>
        </Grid>
      </Grid>

      {/* Modal de Pré-Cadastro de Cliente */}
      <Dialog open={openNewClientModal} onClose={() => setOpenNewClientModal(false)}>
        <DialogTitle>Pré-Cadastro de Cliente</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome Completo"
            type="text"
            fullWidth
            variant="standard"
            value={newClient.nome}
            onChange={(e) => setNewClient({ ...newClient, nome: e.target.value })}
          />
          <TextField
            margin="dense"
            label="CNPJ ou CPF"
            type="text"
            fullWidth
            variant="standard"
            value={newClient.cnpj_cpf}
            onChange={(e) => setNewClient({ ...newClient, cnpj_cpf: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewClientModal(false)}>Cancelar</Button>
          <Button onClick={handleSaveNewClient}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default NovoOrcamento;