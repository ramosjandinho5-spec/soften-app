import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  useTheme,
  useMediaQuery,
  Grid,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import PrintIcon from '@mui/icons-material/Print';
import DeleteIcon from '@mui/icons-material/Delete';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

const printStyles = `
  @media print {
    .no-print {
      display: none !important;
    }
    body > *:not(.printable-area) {
      display: none !important;
    }
    .printable-area, .printable-area .MuiDialog-paper {
      position: static !important;
      width: 100% !important;
      max-width: none !important;
      box-shadow: none !important;
      margin: 0 !important;
      transform: none !important;
    }
  }
`;

function Vendas() {
  const { user } = useAuth();
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [vendaToDelete, setVendaToDelete] = useState(null);
  const [openPrintModal, setOpenPrintModal] = useState(false);
  const [saleToPrint, setSaleToPrint] = useState(null);
  const [openWhatsAppModal, setOpenWhatsAppModal] = useState(false);
  const [selectedVenda, setSelectedVenda] = useState(null);
  const [whatsAppNumber, setWhatsAppNumber] = useState('');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const PrintStyle = () => <style>{printStyles}</style>;

  useEffect(() => {
    const fetchVendas = async () => {
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
          setVendas([]);
          setLoading(false);
          return;
        }

        // 2. Usar o company_id para buscar as vendas
        let query = supabase
          .from('vendas')
          .select(`
            id,
            created_at,
            valor_total,
            status,
            clientes!id_cliente ( nome )
          `)
          .eq('company_id', companyId) // Corrigido para company_id
          .order('created_at', { ascending: false });

        if (searchTerm) {
          query = query.ilike('clientes.nome', `%${searchTerm}%`);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Erro ao buscar vendas:', error);
        } else {
          setVendas(data);
        }
      } catch (error) {
        console.error('Erro geral ao buscar vendas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendas();
  }, [searchTerm, user]);

  const handleViewVenda = async (vendaId) => {
    setLoading(true);
    const { data: vendaData, error: vendaError } = await supabase
      .from('vendas')
      .select(`
        *,
        endereco_entrega,
        cliente:clientes!id_cliente(*),
        vendedor:colaboradores!vendedor_id(*),
        itens:venda_itens(
          *,
          produto:produtos(*)
        )
      `)
      .eq('id', vendaId)
      .single();
    
    setLoading(false);
    if (vendaError) {
      console.error('Erro ao buscar detalhes da venda:', vendaError);
      return;
    }

    setSaleToPrint(vendaData);
    setOpenPrintModal(true);
  };

  const handleOpenDeleteDialog = (venda) => {
    setVendaToDelete(venda);
    setOpenDeleteDialog(true);
  };

  const handleOpenWhatsAppModal = async (vendaId) => {
    setLoading(true);
    const { data: vendaData, error: vendaError } = await supabase
      .from('vendas')
      .select(`
        *,
        cliente:clientes!id_cliente(*),
        vendedor:colaboradores!vendedor_id(*),
        itens:venda_itens(
          *,
          produto:produtos(*)
        )
      `)
      .eq('id', vendaId)
      .single();
    setLoading(false);

    if (vendaError) {
      console.error('Erro ao buscar dados para WhatsApp:', vendaError);
      return;
    }
    setSelectedVenda(vendaData);
    setWhatsAppNumber(vendaData.cliente.celular || '');
    setOpenWhatsAppModal(true);
  };

  const handleSendWhatsApp = () => {
    if (!selectedVenda) return;

    let mensagem = `*Resumo da Venda Nº ${selectedVenda.id}*\n\n`;
    mensagem += `*Cliente:* ${selectedVenda.cliente.nome}\n`;
    if (selectedVenda.vendedor) {
      mensagem += `*Vendedor:* ${selectedVenda.vendedor.nome}\n`;
    }
    mensagem += '\n*Itens:*\n';
    selectedVenda.itens.forEach(item => {
      mensagem += `- ${item.quantidade}x ${item.produto.name} (R$ ${Number(item.preco_unitario).toFixed(2)}) = R$ ${Number(item.preco_total).toFixed(2)}\n`;
    });
    mensagem += `\n*Subtotal:* R$ ${Number(selectedVenda.valor_subtotal).toFixed(2)}\n`;
    mensagem += `*Desconto:* R$ ${Number(selectedVenda.valor_desconto).toFixed(2)}\n`;
    mensagem += `*Acréscimo (Frete):* R$ ${Number(selectedVenda.valor_acrescimo).toFixed(2)}\n`;
    mensagem += `*Total:* R$ ${Number(selectedVenda.valor_total).toFixed(2)}\n\n`;
    mensagem += `*Pagamento:* ${selectedVenda.forma_pagamento}\n`;

    const encodedMessage = encodeURIComponent(mensagem);
    const phone = whatsAppNumber.replace(/\D/g, '');
    const url = `https://wa.me/55${phone}?text=${encodedMessage}`;

    window.open(url, '_blank');
    setOpenWhatsAppModal(false);
  };

  const handleDeleteVenda = async () => {
    if (!vendaToDelete) return;

    const { error: itensError } = await supabase
      .from('venda_itens')
      .delete()
      .eq('venda_id', vendaToDelete.id);

    if (itensError) {
      console.error('Erro ao excluir itens da venda:', itensError);
      return;
    }

    const { error: vendaError } = await supabase
      .from('vendas')
      .delete()
      .eq('id', vendaToDelete.id);

    if (vendaError) {
      console.error('Erro ao excluir a venda:', vendaError);
    } else {
      setVendas(vendas.filter((v) => v.id !== vendaToDelete.id));
    }

    setOpenDeleteDialog(false);
    setVendaToDelete(null);
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'Finalizada':
        return <Chip label={status} color="success" size="small" />;
      case 'Cancelada':
        return <Chip label={status} color="error" size="small" />;
      case 'Pendente':
        return <Chip label={status} color="warning" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={2} justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Grid item>
          <Typography variant="h4" sx={{ fontWeight: 'bold', fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
            Vendas
          </Typography>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color="primary"
            component={RouterLink}
            to="/vendas/nova"
          >
            Nova Venda
          </Button>
        </Grid>
      </Grid>

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

      {isMobile ? (
        <Grid container spacing={2}>
          {loading ? (
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Grid>
          ) : vendas.length === 0 ? (
            <Grid item xs={12}>
              <Typography align="center" sx={{ p: 2 }}>Nenhuma venda registrada ainda.</Typography>
            </Grid>
          ) : (
            vendas.map((venda) => (
              <Grid item xs={12} key={venda.id}>
                <Paper sx={{ p: 2 }}>
                  <Grid container justifyContent="space-between" alignItems="flex-start">
                    <Grid item xs>
                      <Typography variant="body2" color="text.secondary">{format(new Date(venda.created_at), 'dd/MM/yyyy HH:mm')}</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{venda.clientes.nome}</Typography>
                      <Typography variant="body1">R$ {venda.valor_total.toFixed(2)}</Typography>
                      {getStatusChip(venda.status)}
                    </Grid>
                    <Grid item>
                      <IconButton size="small" onClick={() => handleViewVenda(venda.id)}>
                        <PrintIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenWhatsAppModal(venda.id)}>
                        <WhatsAppIcon sx={{ color: '#25D366' }} fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenDeleteDialog(venda)} color="error">
                        <DeleteIcon fontSize="small" />
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
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'primary.main', color: 'white' }}>
            <Typography variant="h6">Histórico de Vendas</Typography>
          </Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Valor Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : vendas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Nenhuma venda registrada ainda.
                  </TableCell>
                </TableRow>
              ) : (
                vendas.map((venda) => (
                  <TableRow key={venda.id}>
                    <TableCell>{format(new Date(venda.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell>{venda.clientes.nome}</TableCell>
                    <TableCell>R$ {venda.valor_total.toFixed(2)}</TableCell>
                    <TableCell>{getStatusChip(venda.status)}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleViewVenda(venda.id)}>
                        <PrintIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenWhatsAppModal(venda.id)}>
                        <WhatsAppIcon sx={{ color: '#25D366' }} fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenDeleteDialog(venda)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza de que deseja excluir a venda #{vendaToDelete?.id}? Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
          <Button onClick={handleDeleteVenda} color="error" variant="contained">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      {saleToPrint && (
        <Dialog 
          open={openPrintModal} 
          onClose={() => setOpenPrintModal(false)} 
          maxWidth="md"
          className="printable-area"
        >
            <PrintStyle />
            <DialogTitle className="no-print">Nota da Venda</DialogTitle>
            <DialogContent>
                <Box id="nota-para-imprimir" sx={{ p: 3, fontFamily: 'Arial, sans-serif', color: '#000' }}>
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
                            <TableCell>{item.produto.name}</TableCell>
                            <TableCell align="right">{item.quantidade}</TableCell>
                            <TableCell align="right">R$ {Number(item.preco_unitario).toFixed(2)}</TableCell>
                            <TableCell align="right">R$ {Number(item.preco_total).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    </TableContainer>

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
            </DialogContent>
            <DialogActions className="no-print">
                <Button onClick={() => setOpenPrintModal(false)}>Fechar</Button>
                <Button onClick={() => window.print()} variant="contained">Imprimir</Button>
            </DialogActions>
        </Dialog>
      )}

      {/* Modal para WhatsApp */}
      <Dialog open={openWhatsAppModal} onClose={() => setOpenWhatsAppModal(false)}>
        <DialogTitle>Enviar Resumo por WhatsApp</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Número do WhatsApp"
            fullWidth
            variant="outlined"
            value={whatsAppNumber}
            onChange={(e) => setWhatsAppNumber(e.target.value)}
            placeholder="(XX) XXXXX-XXXX"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenWhatsAppModal(false)}>Cancelar</Button>
          <Button onClick={handleSendWhatsApp} variant="contained">Enviar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Vendas;