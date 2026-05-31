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
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { supabase } from '../supabaseClient';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';

const formaPagamentoOpcoes = [
  'Dinheiro',
  'Cartão de Crédito',
  'Cartão de Débito',
  'PIX',
  'Boleto Bancário',
  'Transferência Bancária',
];

const tipoEntregaOpcoes = [
    'Retirada no local',
    'Entrega (Delivery)',
];

const printStyles = `
  @media print {
    body > *:not(.MuiDialog-root) {
      display: none !important;
    }
    .MuiDialog-root {
      position: static !important;
    }
    .MuiDialog-container, .MuiDialog-paper {
      position: static !important;
      width: 100% !important;
      max-width: none !important;
      box-shadow: none !important;
      margin: 0 !important;
      transform: none !important;
    }
    .MuiDialogActions-root {
      display: none !important;
    }
  }
`;

function NovaVenda() {
  const { user } = useAuth(); // Pega o usuário do contexto
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [vendedores, setVendedores] = useState([]); // Novo estado para vendedores
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [selectedVendedor, setSelectedVendedor] = useState(null); // Novo estado para vendedor selecionado
  const [selectedProduto, setSelectedProduto] = useState(null);
  const [itensVenda, setItensVenda] = useState([]);
  
  const [subtotal, setSubtotal] = useState(0);
  const [descontoReais, setDescontoReais] = useState(0);
  const [descontoPercent, setDescontoPercent] = useState(0);
  const [acrescimoReais, setAcrescimoReais] = useState(0);
  const [totalVenda, setTotalVenda] = useState(0);
  
  const [formaPagamento, setFormaPagamento] = useState('Dinheiro');
  const [tipoEntrega, setTipoEntrega] = useState('Retirada no local');

  const [openNewClientModal, setOpenNewClientModal] = useState(false);
  const [newClient, setNewClient] = useState({ nome: '', cnpj_cpf: '' });

  const [openNewProductModal, setOpenNewProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', sale_price: '' });

  const [openAddressModal, setOpenAddressModal] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState(null);
  
  const [openPrintModal, setOpenPrintModal] = useState(false);
  const [saleToPrint, setSaleToPrint] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [companyId, setCompanyId] = useState(null);

  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  // Estilos de impressão
  const PrintStyle = () => <style>{printStyles}</style>;

  // Busca o Company ID primeiro
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
    if (!companyId) return; // Não faz nada se não tiver companyId

    const { data: clientesData, error: clientesError } = await supabase
      .from('clientes')
      .select('id, nome, rua, numero, bairro, cidade, estado, cep')
      .eq('company_id', companyId);

    if (clientesError) {
      console.error('Erro ao buscar clientes:', clientesError);
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

  useEffect(() => {
    if (companyId) { // Só busca os dados se tiver o companyId
      fetchInitialData();
    }
  }, [companyId, fetchInitialData]);

  const calcularTotais = useCallback(() => {
    const sub = itensVenda.reduce((acc, item) => acc + (item.quantidade * item.preco), 0);
    setSubtotal(sub);

    const dr = parseFloat(descontoReais) || 0;
    const dp = parseFloat(descontoPercent) || 0;
    const ar = parseFloat(acrescimoReais) || 0;

    const descontoTotal = dr + (sub * (dp / 100));
    const subtotalComDesconto = sub - descontoTotal;
    const total = subtotalComDesconto + ar;
    
    setTotalVenda(total > 0 ? total : 0);
  }, [itensVenda, descontoReais, descontoPercent, acrescimoReais]);

  useEffect(() => {
    calcularTotais();
  }, [calcularTotais]);

  const handleAddProduto = () => {
    if (!selectedProduto || !selectedProduto.id) {
      enqueueSnackbar('Selecione um produto válido para adicionar.', { variant: 'warning' });
      return;
    }
    
    const isAlreadyInCart = itensVenda.find(item => item.id === selectedProduto.id);
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

    setItensVenda([...itensVenda, newItem]);
    setSelectedProduto(null);
  };
  
  const handleItemChange = (id, field, value) => {
    const newItens = itensVenda.map(item => {
        if (item.id === id) {
            const val = parseFloat(value);
            return { ...item, [field]: val >= 0 ? val : 0 };
        }
        return item;
    });
    setItensVenda(newItens);
  };

  const handleRemoveItem = (id) => {
    setItensVenda(itensVenda.filter(item => item.id !== id));
  };

  const handleTipoEntregaChange = (value) => {
    setTipoEntrega(value);
    if (value === 'Entrega (Delivery)') {
        if (selectedCliente) {
            // Prepara o endereço de entrega e abre o modal
            setDeliveryAddress({
                rua: selectedCliente.rua || '',
                numero: selectedCliente.numero || '',
                bairro: selectedCliente.bairro || '',
                cidade: selectedCliente.cidade || '',
                estado: selectedCliente.estado || '',
                cep: selectedCliente.cep || '',
            });
            setOpenAddressModal(true);
        } else {
            enqueueSnackbar('Selecione um cliente antes de definir a entrega.', { variant: 'warning' });
            setTipoEntrega('Retirada no local'); // Reverte a seleção
        }
    }
  };

  const handleFinalizarVenda = async () => {
    if (!companyId) {
        enqueueSnackbar('ID da empresa não encontrado.', { variant: 'error' });
        return;
    }
    if (!selectedCliente) {
        enqueueSnackbar('Por favor, selecione um cliente.', { variant: 'error' });
        return;
    }
    if (itensVenda.length === 0) {
        enqueueSnackbar('Adicione pelo menos um item à venda.', { variant: 'error' });
        return;
    }

    try {
        // ETAPA 1: Verificar se o caixa está aberto
        const { data: caixaAberto, error: caixaError } = await supabase
            .from('caixa_sessoes')
            .select('id')
            .eq('company_id', companyId)
            .eq('status', 'ABERTO')
            .single();

        if (caixaError && caixaError.code !== 'PGRST116') { // PGRST116 = no rows found
            throw new Error(`Falha ao verificar o status do caixa: ${caixaError.message}`);
        }

        if (!caixaAberto) {
            enqueueSnackbar('Não é possível registrar a venda. O caixa está fechado.', { variant: 'error' });
            return;
        }

        // Prepara o objeto de inserção da venda
        const vendaInsertData = {
            id_cliente: selectedCliente.id,
            vendedor_id: selectedVendedor ? selectedVendedor.id : null, // Adiciona o ID do vendedor
            valor_subtotal: subtotal,
            valor_desconto: parseFloat(descontoReais) + (subtotal * (parseFloat(descontoPercent) / 100)),
            valor_acrescimo: parseFloat(acrescimoReais),
            valor_total: totalVenda,
            forma_pagamento: formaPagamento,
            tipo_entrega: tipoEntrega,
            status: 'Finalizada',
            company_id: companyId,
            sessao_caixa_id: caixaAberto.id, // Adiciona o ID da sessão de caixa
            detalhes_pagamento: { [formaPagamento]: totalVenda }, // Adiciona os detalhes do pagamento
        };

        // Adiciona o endereço de entrega se o tipo for 'Entrega (Delivery)'
        if (tipoEntrega === 'Entrega (Delivery)' && deliveryAddress) {
            vendaInsertData.endereco_entrega = deliveryAddress;
        }

        // ETAPA 2: Salvar a venda principal
        const { data: vendaData, error: vendaError } = await supabase
            .from('vendas')
            .insert(vendaInsertData)
            .select()
            .single();

        if (vendaError) throw vendaError;

        // ETAPA 3: Salvar os itens da venda
        const itensParaSalvar = itensVenda.map(item => ({
            venda_id: vendaData.id,
            produto_id: item.id,
            quantidade: item.quantidade,
            preco_unitario: item.preco,
            preco_total: item.quantidade * item.preco,
            company_id: companyId, // Adiciona o ID da empresa
        }));

        const { error: itensError } = await supabase
            .from('venda_itens')
            .insert(itensParaSalvar);

        if (itensError) throw itensError;

        // ETAPA 4: Registrar a movimentação no caixa
        const { error: movimentacaoError } = await supabase
            .from('caixa_movimentacoes')
            .insert({
                sessao_id: caixaAberto.id,
                company_id: companyId,
                usuario_id: user.id,
                tipo: 'VENDA',
                valor: totalVenda,
                descricao: `Referente à Venda #${vendaData.id}`,
            });

        if (movimentacaoError) {
            // Alerta o usuário que a venda foi salva, mas o caixa não foi atualizado.
            enqueueSnackbar('Venda salva, mas falha ao registrar no caixa. Verifique manualmente.', { variant: 'warning', autoHideDuration: 8000 });
            throw movimentacaoError;
        }

        // ETAPA 5: Adicionar ao fluxo de caixa
        const fluxoCaixaData = {
          company_id: companyId,
          usuario_id: user.id,
          valor: totalVenda,
          tipo: 'ENTRADA',
          descricao: `Venda #${vendaData.id}`,
          data_movimento: new Date().toISOString(),
          detalhes_pagamento: { [formaPagamento]: totalVenda }
        };
        const { error: fluxoError } = await supabase.from('fluxo_de_caixa').insert([fluxoCaixaData]);
        if (fluxoError) {
            enqueueSnackbar('Venda registrada, mas falha ao atualizar o Fluxo de Caixa.', { variant: 'warning' });
            // Não lançar erro aqui para não reverter a venda, apenas notificar.
        }

        enqueueSnackbar('Venda finalizada e registrada no caixa!', { variant: 'success' });
        
        // Prepara os dados para impressão
        setSaleToPrint({
            ...vendaData,
            cliente: selectedCliente,
            vendedor: selectedVendedor,
            itens: itensVenda.map(item => ({
                ...item,
                produto: { name: item.name },
                preco_unitario: item.preco,
                preco_total: item.quantidade * item.preco,
            })),
            endereco_entrega: tipoEntrega === 'Entrega (Delivery)' ? deliveryAddress : null,
        });
        setOpenPrintModal(true);

    } catch (error) {
        enqueueSnackbar('Erro ao finalizar a venda: ' + error.message, { variant: 'error' });
        console.error('Erro ao finalizar a venda:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClosePrintModal = () => {
    setOpenPrintModal(false);
    navigate('/vendas');
  };

  const handleAddressChange = (field, value) => {
    setDeliveryAddress(prev => ({ ...prev, [field]: value }));
  };

  const handleConfirmAddress = () => {
    setIsEditingAddress(false);
    setOpenAddressModal(false);
    enqueueSnackbar('Endereço de entrega confirmado!', { variant: 'info' });
  };

  const handleCancelEditAddress = () => {
    // Restaura o endereço original do cliente
    setDeliveryAddress({
        rua: selectedCliente.rua || '',
        numero: selectedCliente.numero || '',
        bairro: selectedCliente.bairro || '',
        cidade: selectedCliente.cidade || '',
        estado: selectedCliente.estado || '',
        cep: selectedCliente.cep || '',
    });
    setIsEditingAddress(false);
  };

  const handleCloseAddressModal = () => {
    setOpenAddressModal(false);
    setIsEditingAddress(false);
    // Se o usuário fechar sem confirmar, reverte o tipo de entrega
    if (tipoEntrega === 'Entrega (Delivery)') {
        setTipoEntrega('Retirada no local');
        enqueueSnackbar('Seleção de entrega foi revertida.', { variant: 'warning' });
    }
  }

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

  const handleSaveNewProduct = async () => {
    if (!companyId) {
        enqueueSnackbar('ID da empresa não encontrado.', { variant: 'error' });
        return;
    }
    if (!newProduct.name || !newProduct.sale_price) {
        enqueueSnackbar('Preencha o nome e o preço de venda.', { variant: 'warning' });
        return;
    }

    const { data, error } = await supabase
        .from('produtos')
        .insert([{ ...newProduct, is_active: true, company_id: companyId }])
        .select()
        .single();

    if (error) {
        enqueueSnackbar('Erro ao cadastrar produto: ' + error.message, { variant: 'error' });
    } else {
        enqueueSnackbar('Produto cadastrado com sucesso! Clique em "Adicionar" para inseri-lo na venda.', { variant: 'info', autoHideDuration: 5000 });
        const novoProdutoCadastrado = data;
        setProdutos(prev => [...prev, novoProdutoCadastrado]);
        setSelectedProduto(novoProdutoCadastrado); // Deixa o novo produto selecionado
        setOpenNewProductModal(false);
        setNewProduct({ name: '', sale_price: '' });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
        Nova Venda
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Itens da Venda</Typography>
            <Grid container spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <Grid item xs={12} sm>
                <Autocomplete
                  fullWidth
                  options={produtos}
                  getOptionLabel={(option) => option.name ? `${option.name} - R$ ${Number(option.sale_price).toFixed(2)}` : ''}
                  value={selectedProduto}
                  onChange={(event, newValue) => setSelectedProduto(newValue)}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderInput={(params) => <TextField {...params} label="Buscar produto" />}
                />
              </Grid>
              <Grid item>
                <IconButton color="primary" onClick={() => setOpenNewProductModal(true)}>
                  <AddIcon />
                </IconButton>
              </Grid>
              <Grid item xs={12} sm="auto">
                <Button fullWidth variant="contained" onClick={handleAddProduto}>Adicionar</Button>
              </Grid>
            </Grid>
            <TableContainer>
              {isMobile ? (
                <Box>
                  {itensVenda.length === 0 ? (
                    <Typography align="center" sx={{ p: 2, color: 'text.secondary' }}>Nenhum item adicionado</Typography>
                  ) : (
                    itensVenda.map((item) => (
                      <Paper key={item.id} sx={{ p: 2, mb: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12}>
                            <Typography variant="h6">{item.name}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              label="Qtd."
                              type="number"
                              value={item.quantidade}
                              onChange={(e) => handleItemChange(item.id, 'quantidade', e.target.value)}
                              size="small"
                              fullWidth
                              InputProps={{ inputProps: { min: 1 } }}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              label="Preço Unit."
                              type="number"
                              value={item.preco}
                              onChange={(e) => handleItemChange(item.id, 'preco', e.target.value)}
                              size="small"
                              fullWidth
                              InputProps={{
                                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                                  inputProps: { min: 0 }
                              }}
                            />
                          </Grid>
                          <Grid item xs={10}>
                            <Typography variant="body1">Subtotal: <strong>R$ {(item.quantidade * item.preco).toFixed(2)}</strong></Typography>
                          </Grid>
                          <Grid item xs={2} sx={{ textAlign: 'right' }}>
                            <IconButton onClick={() => handleRemoveItem(item.id)} color="error">
                              <DeleteIcon />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </Paper>
                    ))
                  )}
                </Box>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: '40%' }}>Produto</TableCell>
                      <TableCell sx={{ width: '15%' }}>Qtd.</TableCell>
                      <TableCell sx={{ width: '20%' }}>Preço Unit.</TableCell>
                      <TableCell sx={{ width: '20%' }}>Subtotal</TableCell>
                      <TableCell sx={{ width: '5%' }}>Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {itensVenda.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">Nenhum item adicionado</TableCell>
                      </TableRow>
                    ) : (
                      itensVenda.map((item) => (
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
                                  inputProps: { min: 0 }
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
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Resumo da Venda</Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Autocomplete
                    fullWidth
                    options={clientes}
                    getOptionLabel={(option) => option.nome || ''}
                    value={selectedCliente}
                    onChange={(event, newValue) => setSelectedCliente(newValue)}
                    renderInput={(params) => <TextField {...params} label="Cliente" />}
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
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    renderInput={(params) => <TextField {...params} label="Vendedor" />}
                />
            </Box>
            {selectedCliente && (
              <Box sx={{ mb: 2, fontSize: '0.875rem', color: 'text.secondary' }}>
                <Typography variant="body2">{`${selectedCliente.rua}, ${selectedCliente.numero}`}</Typography>
                <Typography variant="body2">{`${selectedCliente.bairro}, ${selectedCliente.cidade} - ${selectedCliente.estado}`}</Typography>
                <Typography variant="body2">{`CEP: ${selectedCliente.cep}`}</Typography>
              </Box>
            )}
            
            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Subtotal</Typography>
              <Typography>R$ {subtotal.toFixed(2)}</Typography>
            </Box>

            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Desconto (R$)"
                        type="number"
                        fullWidth
                        value={descontoReais}
                        onChange={(e) => setDescontoReais(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Desconto (%)"
                        type="number"
                        fullWidth
                        value={descontoPercent}
                        onChange={(e) => setDescontoPercent(e.target.value)}
                        InputProps={{
                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        }}
                    />
                </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h5">Total:</Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                R$ {totalVenda.toFixed(2)}
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />

            <TextField
                select
                label="Tipo de Entrega"
                value={tipoEntrega}
                onChange={(e) => handleTipoEntregaChange(e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
            >
                {tipoEntregaOpcoes.map((option) => (
                    <MenuItem key={option} value={option}>
                        {option}
                    </MenuItem>
                ))}
            </TextField>

            {tipoEntrega === 'Entrega (Delivery)' && (
                 <TextField
                    label="Acréscimo (Frete)"
                    type="number"
                    fullWidth
                    value={acrescimoReais}
                    onChange={(e) => setAcrescimoReais(e.target.value)}
                    sx={{ mb: 2 }}
                    InputProps={{
                        startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    }}
                />
            )}

            <TextField
                select
                label="Forma de Pagamento"
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
            >
                {formaPagamentoOpcoes.map((option) => (
                    <MenuItem key={option} value={option}>
                        {option}
                    </MenuItem>
                ))}
            </TextField>

            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              onClick={handleFinalizarVenda}
            >
              Finalizar Venda
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={openNewClientModal} onClose={() => setOpenNewClientModal(false)}>
        <DialogTitle>Pré-cadastro de Cliente</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome / Razão Social"
            type="text"
            fullWidth
            variant="standard"
            value={newClient.nome}
            onChange={(e) => setNewClient({ ...newClient, nome: e.target.value })}
          />
          <TextField
            margin="dense"
            label="CNPJ / CPF"
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

      <Dialog open={openNewProductModal} onClose={() => setOpenNewProductModal(false)}>
        <DialogTitle>Pré-cadastro de Produto</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome do Produto"
            type="text"
            fullWidth
            variant="standard"
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Preço de Venda"
            type="number"
            fullWidth
            variant="standard"
            value={newProduct.sale_price}
            onChange={(e) => setNewProduct({ ...newProduct, sale_price: e.target.value })}
            InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewProductModal(false)}>Cancelar</Button>
          <Button onClick={handleSaveNewProduct}>Salvar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openAddressModal} onClose={handleCloseAddressModal} fullScreen={isMobile} maxWidth="sm" fullWidth>
        <AppBar sx={{ position: 'relative' }}>
            <Toolbar>
                <IconButton edge="start" color="inherit" onClick={handleCloseAddressModal} aria-label="close">
                    <CloseIcon />
                </IconButton>
                <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                            {isEditingAddress ? 'Editar Endereço' : 'Confirmar Endereço'}
                        </Typography>
                        {isEditingAddress ? (
                            <>
                                <Button color="inherit" onClick={handleCancelEditAddress}>Cancelar</Button>
                                <Button color="inherit" onClick={() => setIsEditingAddress(false)}>Salvar</Button>
                            </>
                        ) : (
                            <>
                                <Button color="inherit" onClick={() => setIsEditingAddress(true)}>Editar</Button>
                                <Button color="inherit" onClick={handleConfirmAddress}>Confirmar</Button>
                            </>
                        )}
            </Toolbar>
        </AppBar>
        <DialogTitle sx={{ display: isMobile ? 'none' : 'block' }}>
            {isEditingAddress ? 'Editar Endereço de Entrega' : 'Confirmar Endereço de Entrega'}
        </DialogTitle>
        <DialogContent>
            {deliveryAddress && (
                <Box sx={{ mt: 2 }}>
                    {isEditingAddress ? (
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={8}>
                                <TextField label="Rua" fullWidth value={deliveryAddress.rua} onChange={(e) => handleAddressChange('rua', e.target.value)} margin="dense" />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField label="Número" fullWidth value={deliveryAddress.numero} onChange={(e) => handleAddressChange('numero', e.target.value)} margin="dense" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField label="Bairro" fullWidth value={deliveryAddress.bairro} onChange={(e) => handleAddressChange('bairro', e.target.value)} margin="dense" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField label="Cidade" fullWidth value={deliveryAddress.cidade} onChange={(e) => handleAddressChange('cidade', e.target.value)} margin="dense" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField label="Estado" fullWidth value={deliveryAddress.estado} onChange={(e) => handleAddressChange('estado', e.target.value)} margin="dense" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField label="CEP" fullWidth value={deliveryAddress.cep} onChange={(e) => handleAddressChange('cep', e.target.value)} margin="dense" />
                            </Grid>
                        </Grid>
                    ) : (
                        <>
                            <Typography variant="h6">{selectedCliente?.nome}</Typography>
                            <Divider sx={{ my: 2 }} />
                            <Typography><strong>Rua:</strong> {deliveryAddress.rua || ''}</Typography>
                            <Typography><strong>Número:</strong> {deliveryAddress.numero || ''}</Typography>
                            <Typography><strong>Bairro:</strong> {deliveryAddress.bairro || ''}</Typography>
                            <Typography><strong>Cidade:</strong> {deliveryAddress.cidade || ''}</Typography>
                            <Typography><strong>Estado:</strong> {deliveryAddress.estado || ''}</Typography>
                            <Typography><strong>CEP:</strong> {deliveryAddress.cep || ''}</Typography>
                        </>
                    )}
                </Box>
            )}
        </DialogContent>
        {!isMobile && (
            <DialogActions sx={{ p: 2 }}>
                {isEditingAddress ? (
                    <>
                        <Button onClick={handleCancelEditAddress}>Cancelar</Button>
                        <Button onClick={() => setIsEditingAddress(false)} variant="contained">Salvar Alterações</Button>
                    </>
                ) : (
                    <>
                        <Button onClick={handleCloseAddressModal}>Cancelar</Button>
                        <Button onClick={() => setIsEditingAddress(true)}>Editar</Button>
                        <Button onClick={handleConfirmAddress} variant="contained">Confirmar Endereço</Button>
                    </>
                )}
            </DialogActions>
        )}
      </Dialog>

      {/* Modal de Impressão */}
      <Dialog open={openPrintModal} onClose={handleClosePrintModal} maxWidth="md" fullScreen={isMobile}>
        <PrintStyle />
        {isMobile && (
          <AppBar sx={{ position: 'relative', displayPrint: 'none' }}>
            <Toolbar>
              <IconButton
                edge="start"
                color="inherit"
                onClick={handleClosePrintModal}
                aria-label="close"
              >
                <CloseIcon />
              </IconButton>
              <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                Nota da Venda
              </Typography>
              <Button autoFocus color="inherit" onClick={handlePrint}>
                Imprimir
              </Button>
            </Toolbar>
          </AppBar>
        )}
        <DialogTitle className="no-print" sx={{ display: isMobile ? 'none' : 'block' }}>Nota da Venda</DialogTitle>
        <DialogContent>
        {saleToPrint && (
          <Box id="nota-para-imprimir" sx={{ p: 3, fontFamily: 'Arial, sans-serif', color: '#000', mt: isMobile ? 2 : 0 }}>
            <Typography variant="h5" gutterBottom align="center">Detalhes da Venda</Typography>
            
            <table style={{ width: '100%', borderBottom: '1px solid #ccc', marginBottom: '20px' }}>
              <tbody>
                <tr>
                  <td style={{ width: '70%', verticalAlign: 'top', padding: '0 8px 16px 0' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Cliente:</Typography>
                            <Typography>{saleToPrint.cliente.nome}</Typography>
                            {saleToPrint.endereco_entrega ? (
                                <>
                                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                                        (Endereço de entrega)
                                    </Typography>
                                    <Typography variant="body2">
                                        {`${saleToPrint.endereco_entrega.rua || ''}, ${saleToPrint.endereco_entrega.numero || ''} - ${saleToPrint.endereco_entrega.bairro || ''}`}
                                    </Typography>
                                    <Typography variant="body2">
                                        {`${saleToPrint.endereco_entrega.cidade || ''} - ${saleToPrint.endereco_entrega.estado || ''}`}
                                    </Typography>
                                </>
                            ) : (
                                <>
                                    <Typography variant="body2">
                                        {`${saleToPrint.cliente.rua || ''}, ${saleToPrint.cliente.numero || ''} - ${saleToPrint.cliente.bairro || ''}`}
                                    </Typography>
                                    <Typography variant="body2">
                                        {`${saleToPrint.cliente.cidade || ''} - ${saleToPrint.cliente.estado || ''}`}
                                    </Typography>
                                </>
                            )}
                            {saleToPrint.vendedor && (
                                <>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }}>Vendedor:</Typography>
                                    <Typography>{saleToPrint.vendedor.nome}</Typography>
                                </>
                            )}
                        </td>
                  <td style={{ width: '30%', verticalAlign: 'top', textAlign: 'right', padding: '0 0 16px 8px' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Venda #{saleToPrint.id}</Typography>
                    <Typography variant="body2">
                      Data: {new Date(saleToPrint.created_at).toLocaleDateString()}
                    </Typography>
                  </td>
                </tr>
              </tbody>
            </table>

            <TableContainer component={Paper} elevation={0} sx={{ mb: 3, border: '1px solid #eee' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Produto</TableCell>
                    <TableCell align="right">Qtd.</TableCell>
                    <TableCell align="right">Preço Unit.</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {saleToPrint.itens.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell align="right">{item.quantidade}</TableCell>
                      <TableCell align="right">R$ {Number(item.preco).toFixed(2)}</TableCell>
                      <TableCell align="right">R$ {(item.quantidade * item.preco).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Totais com Tabela para garantir o layout na impressão */}
            <table style={{ width: '100%' }}>
              <tbody>
                <tr>
                  <td style={{ width: '50%' }}></td>
                  <td style={{ width: '50%' }}>
                    <table style={{ width: '100%' }}>
                      <tbody>
                        <tr>
                          <td>Subtotal:</td>
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>R$ {Number(saleToPrint.valor_subtotal).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td>Desconto:</td>
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>R$ {Number(saleToPrint.valor_desconto).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td>Acréscimo (Frete):</td>
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>R$ {Number(saleToPrint.valor_acrescimo).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td colSpan="2"><hr style={{ border: 'none', borderTop: '1px solid #ccc' }} /></td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 'bold' }}>Total:</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', whiteSpace: 'nowrap' }}>R$ {Number(saleToPrint.valor_total).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td colSpan="2"><hr style={{ border: 'none', borderTop: '1px solid #ccc' }} /></td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 'bold' }}>Pagamento:</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{saleToPrint.forma_pagamento}</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </Box>
        )}
        </DialogContent>
        <DialogActions className="no-print" sx={{ display: isMobile ? 'none' : 'flex' }}>
          <Button onClick={handleClosePrintModal}>Fechar</Button>
          <Button onClick={handlePrint} variant="contained">Imprimir</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default NovaVenda;