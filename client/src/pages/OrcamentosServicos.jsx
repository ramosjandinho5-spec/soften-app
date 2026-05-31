import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  TextField,
  InputAdornment,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, WhatsApp as WhatsAppIcon, Search as SearchIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const OrcamentosServicos = () => {
  const [orcamentos, setOrcamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState({ open: false, orcamentoId: null });
  const [whatsappData, setWhatsappData] = useState({ open: false, orcamento: null, telefone: '' });

  const fetchOrcamentos = useCallback(async () => {
    if (!companyId) return;

    setLoading(true);
    let query = supabase
      .from('orcamentos_servicos')
      .select(`
        id,
        created_at,
        valor_total,
        subtotal,
        desconto,
        acrescimo,
        status,
        clientes (
          id,
          nome,
          celular
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (searchTerm) {
      query = query.ilike('clientes.nome', `%${searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) {
      enqueueSnackbar('Erro ao carregar os orçamentos de serviços.', { variant: 'error' });
      console.error('Erro ao carregar orçamentos de serviços:', error);
    } else {
      setOrcamentos(data);
    }
    setLoading(false);
  }, [companyId, enqueueSnackbar, searchTerm]);

  useEffect(() => {
    if (companyId) {
      fetchOrcamentos();
    } else {
      setLoading(false);
    }
  }, [companyId, fetchOrcamentos]);



  const handleDelete = async (orcamentoId) => {
    setDeleteConfirmation({ open: true, orcamentoId });
  };

  const confirmDelete = async () => {
    const { orcamentoId } = deleteConfirmation;
    const { error } = await supabase.from('orcamentos_servicos').delete().eq('id', orcamentoId);

    if (error) {
      enqueueSnackbar('Erro ao deletar o orçamento.', { variant: 'error' });
    } else {
      enqueueSnackbar('Orçamento deletado com sucesso!', { variant: 'success' });
      fetchOrcamentos();
    }
    setDeleteConfirmation({ open: false, orcamentoId: null });
  };

  const handleEdit = (orcamentoId) => {
    navigate(`/orcamentos-servicos/editar/${orcamentoId}`);
  };
  
  const handleOpenWhatsappDialog = (orcamento) => {
    setWhatsappData({ open: true, orcamento, telefone: orcamento.clientes?.celular || '' });
  };

  const handleSendWhatsapp = async () => {
    const { orcamento, telefone } = whatsappData;
    if (!orcamento || !telefone) {
        enqueueSnackbar('Número de celular inválido ou não informado.', { variant: 'error' });
        return;
    }

    const { data: items, error } = await supabase
        .from('orcamento_servico_items')
        .select(`
            quantidade,
            subtotal,
            servicos (
                nome,
                preco
            )
        `)
        .eq('orcamento_servico_id', orcamento.id);

    if (error) {
        enqueueSnackbar('Erro ao buscar itens do orçamento.', { variant: 'error' });
        return;
    }

    let message = `*Orçamento de Serviços*\n\n`;
    message += `*Cliente:* ${orcamento.clientes.nome}\n\n`;
    message += `*Itens:*\n`;
    items.forEach(item => {
        message += `- ${item.servicos.nome}: ${item.quantidade} x R$ ${Number(item.servicos.valor).toFixed(2)} = R$ ${Number(item.subtotal).toFixed(2)}\n`;
    });
    message += `\n*Subtotal:* R$ ${Number(orcamento.subtotal).toFixed(2)}\n`;
    if (orcamento.desconto > 0) {
        message += `*Desconto:* R$ ${Number(orcamento.desconto).toFixed(2)}\n`;
    }
    if (orcamento.acrescimo > 0) {
        message += `*Acréscimo:* R$ ${Number(orcamento.acrescimo).toFixed(2)}\n`;
    }
    message += `*Total:* R$ ${Number(orcamento.valor_total).toFixed(2)}\n`;

    const whatsappUrl = `https://api.whatsapp.com/send?phone=55${telefone.replace(/\D/g, '')}&text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setWhatsappData({ open: false, orcamento: null, telefone: '' });
  };


  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', mb: 2, gap: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: isMobile ? 0 : 2 }}>
          Orçamentos de Serviços
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 1, alignItems: 'center' }}>
          <TextField
            label="Buscar por Cliente"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: isMobile ? '100%' : 'auto' }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/novo-orcamento-servico')}
            sx={{ width: isMobile ? '100%' : 'auto' }}
          >
            Novo Orçamento
          </Button>
        </Box>
      </Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Cliente</TableCell>
                <TableCell>Data</TableCell>
                <TableCell>Valor Total</TableCell>
                {!isMobile && <TableCell>Status</TableCell>}
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orcamentos.map((orcamento) => (
                <TableRow key={orcamento.id}>
                  <TableCell>{orcamento.clientes?.nome || 'N/A'}</TableCell>
                  <TableCell>{new Date(orcamento.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>R$ {Number(orcamento.valor_total).toFixed(2)}</TableCell>
                  {!isMobile && <TableCell>{orcamento.status}</TableCell>}
                  <TableCell>
                    <IconButton onClick={() => handleEdit(orcamento.id)}><EditIcon /></IconButton>
                    <IconButton onClick={() => handleDelete(orcamento.id)}><DeleteIcon /></IconButton>
                    <IconButton onClick={() => handleOpenWhatsappDialog(orcamento)}><WhatsAppIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Confirmação de Exclusão */}
      <Dialog
        open={deleteConfirmation.open}
        onClose={() => setDeleteConfirmation({ open: false, orcamentoId: null })}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja deletar este orçamento?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmation({ open: false, orcamentoId: null })}>Cancelar</Button>
          <Button onClick={confirmDelete} color="primary">Deletar</Button>
        </DialogActions>
      </Dialog>
      
      {/* Envio de WhatsApp */}
      <Dialog open={whatsappData.open} onClose={() => setWhatsappData({ open: false, orcamento: null, telefone: '' })}>
        <DialogTitle>Enviar Orçamento por WhatsApp</DialogTitle>
        <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
                Confirme o número de telefone para enviar o orçamento para o cliente {whatsappData.orcamento?.clientes?.nome}.
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              id="telefone"
              label="Número do WhatsApp"
              type="tel"
              fullWidth
              variant="standard"
              value={whatsappData.telefone}
              onChange={(e) => setWhatsappData(prev => ({ ...prev, telefone: e.target.value }))}
            />
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setWhatsappData({ open: false, orcamento: null, telefone: '' })}>Cancelar</Button>
            <Button onClick={handleSendWhatsapp} color="primary">Enviar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrcamentosServicos;