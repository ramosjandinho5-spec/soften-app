import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  IconButton, 
  Container,
  TextField,
  InputAdornment,
  CircularProgress,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SearchIcon from '@mui/icons-material/Search';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from 'notistack';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

function Orcamentos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [orcamentos, setOrcamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState(null);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [selectedOrcamento, setSelectedOrcamento] = useState(null);
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [orcamentoToConvert, setOrcamentoToConvert] = useState(null);
  const [openConvertToVendaDialog, setOpenConvertToVendaDialog] = useState(false);

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
          enqueueSnackbar('Erro ao verificar a empresa.', { variant: 'error' });
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

  const fetchOrcamentos = useCallback(async () => {
    if (!companyId) return;

    setLoading(true);
    let query = supabase
      .from('orcamentos')
      .select(`
        id,
        numero_orcamento,
        created_at,
        valor_total,
        subtotal,
        desconto,
        status,
        clientes (
          id,
          nome,
          celular
        ),
        colaboradores (
          id,
          nome
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (searchTerm) {
      query = query.ilike('clientes.nome', `%${searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) {
      enqueueSnackbar('Erro ao carregar os orçamentos.', { variant: 'error' });
      console.error('Erro ao carregar orçamentos:', error);
    } else {
      setOrcamentos(data);
    }
    setLoading(false);
  }, [companyId, enqueueSnackbar, searchTerm]);

  useEffect(() => {
    if (companyId) {
      fetchOrcamentos();
    }
  }, [companyId, fetchOrcamentos]);

  const handleOpenDeleteDialog = (orcamento) => {
    setOrcamentoToDelete(orcamento);
    setOpenDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!orcamentoToDelete) return;

    // Primeiro, exclua os itens do orçamento
    const { error: itensError } = await supabase
      .from('orcamento_itens')
      .delete()
      .eq('orcamento_id', orcamentoToDelete.id);

    if (itensError) {
      enqueueSnackbar(`Erro ao excluir itens do orçamento: ${itensError.message}`, { variant: 'error' });
      setOpenDeleteDialog(false);
      return;
    }

    // Depois, exclua o orçamento principal
    const { error: orcamentoError } = await supabase
      .from('orcamentos')
      .delete()
      .eq('id', orcamentoToDelete.id);

    if (orcamentoError) {
      enqueueSnackbar(`Erro ao excluir o orçamento: ${orcamentoError.message}`, { variant: 'error' });
    } else {
      enqueueSnackbar('Orçamento excluído com sucesso!', { variant: 'success' });
      fetchOrcamentos(); // Atualiza a lista
    }
    setOpenDeleteDialog(false);
    setOrcamentoToDelete(null);
  };

  const handleConvertToVenda = (orcamento) => {
    setOrcamentoToConvert(orcamento);
    setOpenConvertToVendaDialog(true);
  };

  const executeConvertToVenda = async () => {
    if (!orcamentoToConvert) return;
  
    setLoading(true);
  
    try {
      // 1. Buscar os itens do orçamento
      const { data: orcamentoItens, error: itensError } = await supabase
        .from('orcamento_itens')
        .select('*')
        .eq('orcamento_id', orcamentoToConvert.id);
  
      if (itensError) throw itensError;
  
      // 2. Criar a venda
      const { data: vendaData, error: vendaError } = await supabase
        .from('vendas')
        .insert({
          id_cliente: orcamentoToConvert.clientes.id,
          valor_total: orcamentoToConvert.valor_total,
          status: 'Finalizada', // A venda já nasce finalizada
          company_id: companyId,
        })
        .select()
        .single();
  
      if (vendaError) throw vendaError;
  
      // 3. Inserir os itens na venda
      const vendaItens = orcamentoItens.map(item => ({
        venda_id: vendaData.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        preco_total: item.quantidade * item.preco_unitario,
      }));
  
      const { error: vendaItensError } = await supabase
        .from('venda_itens')
        .insert(vendaItens);
  
      if (vendaItensError) throw vendaItensError;
  
      // 4. Atualizar o status do orçamento
      const { error: updateOrcamentoError } = await supabase
        .from('orcamentos')
        .update({ status: 'Finalizado' })
        .eq('id', orcamentoToConvert.id);
  
      if (updateOrcamentoError) throw updateOrcamentoError;
  
      enqueueSnackbar('Orçamento convertido em venda com sucesso!', { variant: 'success' });
      fetchOrcamentos(); // Atualiza a lista
  
    } catch (error) {
      console.error('Erro ao converter orçamento em venda:', error);
      enqueueSnackbar(`Erro ao converter orçamento: ${error.message}`, { variant: 'error' });
    } finally {
      setLoading(false);
      setOpenConvertToVendaDialog(false);
      setOrcamentoToConvert(null);
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'Finalizado':
        return <Chip label={status} color="success" size="small" />;
      case 'Cancelado':
        return <Chip label={status} color="error" size="small" />;
      case 'Pendente':
        return <Chip label={status} color="warning" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const handleOpenWhatsAppModal = (orcamento) => {
    setSelectedOrcamento(orcamento);
    setClienteTelefone(orcamento.clientes?.celular || '');
    setWhatsAppModalOpen(true);
  };

  const handleSendWhatsApp = async () => {
    if (!selectedOrcamento || !clienteTelefone) {
      enqueueSnackbar('Número de telefone inválido.', { variant: 'warning' });
      return;
    }

    // Buscar itens do orçamento
    const { data: itens, error } = await supabase
      .from('orcamento_itens')
      .select('*, produtos(*)')
      .eq('orcamento_id', selectedOrcamento.id);

    if (error) {
      enqueueSnackbar('Erro ao buscar itens do orçamento.', { variant: 'error' });
      return;
    }

    // Montar a mensagem
    const numeroFormatado = selectedOrcamento.numero_orcamento.toString().padStart(2, '0');
    let mensagem = `*Resumo do Orçamento Nº ${numeroFormatado}*\n\n`;
    mensagem += `*Cliente:* ${selectedOrcamento.clientes.nome}\n`;
    if (selectedOrcamento.colaboradores) {
      mensagem += `*Vendedor:* ${selectedOrcamento.colaboradores.nome}\n`;
    }
    mensagem += `\n`;

    itens.forEach(item => {
      mensagem += `*- ${item.produtos.name}*\n`;
      mensagem += `  (Qtd: ${item.quantidade}, Preço Unit.: R$ ${item.preco_unitario.toFixed(2)})\n`;
    });
    mensagem += `\n*Subtotal:* R$ ${selectedOrcamento.subtotal.toFixed(2)}`;
    if (selectedOrcamento.desconto > 0) {
        mensagem += `\n*Desconto:* R$ ${selectedOrcamento.desconto.toFixed(2)}`;
    }
    mensagem += `\n*Total:* R$ ${selectedOrcamento.valor_total.toFixed(2)}`;

    const numeroLimpo = clienteTelefone.replace(/\D/g, '');
    const url = `https://wa.me/55${numeroLimpo}?text=${encodeURIComponent(mensagem)}`;

    window.open(url, '_blank');
    setWhatsAppModalOpen(false);
  };

    return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: { xs: 2, sm: 0 }, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          Orçamentos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={RouterLink}
          to="/orcamentos/novo"
        >
          Criar Novo Orçamento
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Box sx={{ width: 300 }}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Buscar por cliente..."
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

      <Paper>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'primary.main', color: 'white' }}>
          <Typography variant="h6">Histórico de Orçamentos</Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Data</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Valor Total</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : orcamentos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Nenhum orçamento encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                orcamentos.map((orcamento) => (
                  <TableRow key={orcamento.id}>
                    <TableCell>{orcamento.clientes?.nome || 'Cliente não encontrado'}</TableCell>
                    <TableCell>{format(new Date(orcamento.created_at), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{`R$ ${parseFloat(orcamento.valor_total).toFixed(2)}`}</TableCell>
                    <TableCell>{getStatusChip(orcamento.status)}</TableCell>
                    <TableCell align="right">
                      {orcamento.status === 'Pendente' && (
                        <IconButton onClick={() => handleConvertToVenda(orcamento)} size="small" color="success">
                          <PriceCheckIcon />
                        </IconButton>
                      )}
                      <IconButton onClick={() => handleOpenWhatsAppModal(orcamento)} size="small">
                        <WhatsAppIcon />
                      </IconButton>
                      <IconButton component={RouterLink} to={`/orcamentos/editar/${orcamento.id}`} size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleOpenDeleteDialog(orcamento)} size="small">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Modal do WhatsApp */}
      <Dialog open={whatsAppModalOpen} onClose={() => setWhatsAppModalOpen(false)}>
        <DialogTitle>Enviar Orçamento via WhatsApp</DialogTitle>
        <DialogContent>
          <DialogContentText>
            O número de telefone do cliente é <strong>{selectedOrcamento?.clientes?.celular}</strong>. Deseja usar este número ou inserir um novo?
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="telefone"
            label="Número do WhatsApp"
            type="text"
            fullWidth
            variant="standard"
            value={clienteTelefone}
            onChange={(e) => setClienteTelefone(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWhatsAppModalOpen(false)}>Cancelar</Button>
          <Button onClick={handleSendWhatsApp}>Enviar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error">Excluir</Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Confirmação de Conversão para Venda */}
      <Dialog
        open={openConvertToVendaDialog}
        onClose={() => setOpenConvertToVendaDialog(false)}
      >
        <DialogTitle>Confirmar Conversão para Venda</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja converter este orçamento em uma venda? O status do orçamento será alterado para "Finalizado".
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConvertToVendaDialog(false)}>Cancelar</Button>
          <Button onClick={executeConvertToVenda} color="primary">Confirmar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Orcamentos;