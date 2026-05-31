import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Typography, Paper, Box, Chip, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Grid, Autocomplete, IconButton, Menu, MenuItem, useTheme, useMediaQuery } from '@mui/material';
import { ptBR } from '@mui/x-data-grid/locales';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LinkIcon from '@mui/icons-material/Link';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useSnackbar } from 'notistack';
import { useAuth } from '../contexts/AuthContext';
import { useOutletContext, useNavigate } from 'react-router-dom';

// Mapeamento de status para cores do Chip
const statusConfig = {
  'Agendado': { color: 'primary', variant: 'outlined' },
  'Confirmado': { color: 'secondary', variant: 'filled' },
  'Em Andamento': { color: 'warning', variant: 'filled' },
  'Finalizado': { color: 'success', variant: 'filled' },
  'Cancelado': { color: 'error', variant: 'outlined' },
};

import PagamentoModal from '../components/PagamentoModal';
import GerenciadorBloqueiosModal from '../components/GerenciadorBloqueiosModal';
import VerHorariosModal from '../components/VerHorariosModal';

const AgendaServicos = () => {
  const { supabase } = useAuth();
  const { profile } = useOutletContext(); // Recebe o profile do layout
  const { enqueueSnackbar } = useSnackbar(); // Para notificações modernas
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // Estado para o campo de busca
  const [isPagamentoModalOpen, setPagamentoModalOpen] = useState(false);
  const [isBloqueioModalOpen, setBloqueioModalOpen] = useState(false);
  const [isVerHorariosModalOpen, setVerHorariosModalOpen] = useState(false);
  const [agendamentoParaPagamento, setAgendamentoParaPagamento] = useState(null);
  
  // Estados para o Modal de Fidelidade
  const [isFidelidadeModalOpen, setFidelidadeModalOpen] = useState(false);
  const [selectedClienteData, setSelectedClienteData] = useState({ nome: '', historico: [] });
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  
  const [clientes, setClientes] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);

  const [newAppointment, setNewAppointment] = useState({
    data: '',
    hora: '',
    cliente: null,
    servico: null,
    profissional: null,
    status: 'Agendado',
  });

  // State for the "Add Client" dialog
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [newClient, setNewClient] = useState({ nome: '', telefone: '' });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // State for the actions menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRowId, setSelectedRowId] = useState(null);

  const handleMenuClick = (event, id) => {
    setAnchorEl(event.currentTarget);
    setSelectedRowId(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRowId(null);
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedRowId) return;
    handleMenuClose();

    if (newStatus === 'Finalizado') {
      const agendamento = rows.find(row => row.id === selectedRowId);
      
      // O agendamento já tem o servico_id, mas precisamos do valor.
      // Vamos buscar na lista de serviços que já temos em memória.
      const servicoCompleto = servicos.find(s => s.nome === agendamento.servico);

      if (!servicoCompleto || typeof servicoCompleto.valor === 'undefined') {
        enqueueSnackbar('Não foi possível encontrar o valor para este serviço.', { variant: 'error' });
        return;
      }

      const agendamentoComValor = { 
        ...agendamento, 
        servico_valor: servicoCompleto.valor, 
        company_id: profile.company_id 
      };
      
      setAgendamentoParaPagamento(agendamentoComValor);
      setPagamentoModalOpen(true);
    } else {
      // Lógica para outros status
      const { error } = await supabase
        .from('agendamentos')
        .update({ status: newStatus })
        .eq('id', selectedRowId);

      if (error) {
        enqueueSnackbar(`Não foi possível atualizar o status: ${error.message}`, { variant: 'error' });
      } else {
        fetchAgendamentos(); // Recarrega os dados para refletir a mudança
        enqueueSnackbar('Status do agendamento atualizado com sucesso!', { variant: 'success' });
      }
    }
  };

  const handleDelete = () => {
    if (!selectedRowId) return;
    setDeleteConfirmOpen(true);
    setAnchorEl(null); // Apenas fecha o menu, não limpa o ID
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRowId) return;

    // Primeiro, tenta excluir qualquer receita associada.
    // Se não houver receita, esta operação não fará nada e não retornará erro.
    const { error: deleteReceitaError } = await supabase
      .from('receitas')
      .delete()
      .eq('agendamento_id', selectedRowId);

    if (deleteReceitaError) {
      // Isso seria um erro inesperado, como um problema de rede ou política RLS.
      console.error('Erro ao excluir a receita associada:', deleteReceitaError);
      enqueueSnackbar('Não foi possível remover a receita vinculada ao agendamento.', { variant: 'error' });
      setDeleteConfirmOpen(false);
      return; // Interrompe o processo
    }

    // Se a exclusão da receita foi bem-sucedida (ou se não existia), prossiga para excluir o agendamento.
    const { error: deleteAgendamentoError } = await supabase
      .from('agendamentos')
      .delete()
      .eq('id', selectedRowId);

    if (deleteAgendamentoError) {
      console.error('Erro ao excluir agendamento:', deleteAgendamentoError);
      enqueueSnackbar('Não foi possível excluir o agendamento.', { variant: 'error' });
    } else {
      setRows(currentRows => currentRows.filter(row => row.id !== selectedRowId));
      enqueueSnackbar('Agendamento excluído com sucesso!', { variant: 'success' });
    }
    
    setDeleteConfirmOpen(false);
  };

  const handleFidelidadeClick = async () => {
    if (!selectedRowId) return;
    handleMenuClose();
    setLoadingHistorico(true);
    setFidelidadeModalOpen(true);

    const agendamentoSelecionado = rows.find(row => row.id === selectedRowId);
    if (!agendamentoSelecionado || !agendamentoSelecionado.cliente_id) {
      enqueueSnackbar('Não foi possível identificar o cliente deste agendamento.', { variant: 'error' });
      setLoadingHistorico(false);
      return;
    }

    const { cliente_id, nome } = agendamentoSelecionado;

    try {
      const { data: historicoData, error: historicoError } = await supabase
        .from('agendamentos')
        .select('*, servicos(nome, valor)') // Puxa o nome e valor do serviço
        .eq('cliente_id', cliente_id)
        .order('data', { ascending: false });

      if (historicoError) throw historicoError;

      setSelectedClienteData({
        nome: nome,
        historico: historicoData,
      });

    } catch (error) {
      console.error('Erro ao buscar histórico do cliente:', error);
      enqueueSnackbar('Não foi possível carregar o histórico do cliente.', { variant: 'error' });
    } finally {
      setLoadingHistorico(false);
    }
  };


  const handleShareLink = async () => {
    // Pega o ID da empresa diretamente do perfil do usuário.
    const companyId = profile?.company_id;

    if (!companyId) {
      enqueueSnackbar('ID da empresa não encontrado no seu perfil. Não é possível gerar o link.', { variant: 'error' });
      return;
    }

    try {
      // Faz uma busca direta e específica pelo slug no momento do clique.
      const { data: companyData, error } = await supabase
        .from('empresas')
        .select('slug')
        .eq('id', companyId)
        .single();

      // Se houver um erro na busca ou se a empresa não tiver um slug, falha.
      if (error || !companyData?.slug) {
        throw new Error(error?.message || 'Slug não encontrado para esta empresa.');
      }

      const slug = companyData.slug;
      const publicUrl = `${window.location.origin}/agendar/${slug}`;
      
      // Copia o link para a área de transferência.
      await navigator.clipboard.writeText(publicUrl);
      enqueueSnackbar('Link de agendamento copiado para a área de transferência!', { variant: 'success' });

    } catch (err) {
      console.error('Falha ao gerar ou copiar link:', err);
      // Mensagem de erro genérica para o usuário.
      enqueueSnackbar('Não foi possível encontrar o slug da empresa. Verifique as configurações.', { variant: 'error' });
    }
  };

  const fetchAgendamentos = async () => {
    if (!profile?.company_id) return;

    // Etapa 1: Buscar agendamentos e dados relacionados em paralelo para eficiência.
    const [agendamentosRes, clientesRes, servicosRes, colaboradoresRes] = await Promise.all([
      supabase.from('agendamentos').select('*').eq('company_id', profile.company_id),
      supabase.from('clientes').select('id, nome, telefone').eq('company_id', profile.company_id),
      supabase.from('servicos').select('id, nome').eq('company_id', profile.company_id),
      supabase.from('colaboradores').select('id, nome').eq('company_id', profile.company_id)
    ]);

    // Tratamento de erro centralizado
    if (agendamentosRes.error || clientesRes.error || servicosRes.error || colaboradoresRes.error) {
      console.error('Erro ao buscar dados da agenda:', {
        agendamentosError: agendamentosRes.error,
        clientesError: clientesRes.error,
        servicosError: servicosRes.error,
        colaboradoresError: colaboradoresRes.error,
      });
      enqueueSnackbar('Erro ao carregar os dados da agenda.', { variant: 'error' });
      return;
    }

    // Etapa 2: Criar mapas de busca para uma "junção" eficiente no lado do cliente.
    const clientesMap = new Map(clientesRes.data.map(c => [c.id, c])); // Mapeia o objeto cliente inteiro
    const servicosMap = new Map(servicosRes.data.map(s => [s.id, s.nome]));
    const colaboradoresMap = new Map(colaboradoresRes.data.map(c => [c.id, c.nome]));

    // Etapa 3: Formatar os dados do agendamento, buscando os nomes nos mapas.
    const formattedData = agendamentosRes.data.map(item => {
      const clienteCadastrado = clientesMap.get(item.cliente_id);
      return {
        id: item.id,
        cliente_id: item.cliente_id, // <-- Adicionando o ID do cliente aqui
        data: item.data,
        hora: item.hora,
        // Lógica atualizada: prioriza o nome/telefone salvo diretamente no agendamento.
        nome: item.cliente_nome || clienteCadastrado?.nome || 'Cliente não encontrado',
        telefone: item.cliente_telefone || clienteCadastrado?.telefone || '',
        servico: servicosMap.get(item.servico_id) || 'Serviço não encontrado',
        profissional: colaboradoresMap.get(item.colaborador_id) || 'Profissional não encontrado',
        status: item.status,
      }
    }).sort((a, b) => { // Ordenar no cliente para garantir a consistência
        if (a.data < b.data) return 1;
        if (a.data > b.data) return -1;
        if (a.hora < b.hora) return 1;
        if (a.hora > b.hora) return -1;
        return 0;
    });

    setRows(formattedData);
  };

  useEffect(() => {
    const fetchDropdownData = async () => {
      if (!profile?.company_id) return;

      const { data: clientesData, error: clientesError } = await supabase.from('clientes').select('*').eq('company_id', profile.company_id);
      if (clientesError) console.error('Erro buscando clientes:', clientesError);
      else setClientes(clientesData);

      const { data: servicosData, error: servicosError } = await supabase.from('servicos').select('*').eq('company_id', profile.company_id);
      if (servicosError) console.error('Erro buscando servicos:', servicosError);
      else setServicos(servicosData);

      const { data: colaboradoresData, error: colaboradoresError } = await supabase.from('colaboradores').select('id, nome, horario_trabalho').eq('company_id', profile.company_id);
      if (colaboradoresError) console.error('Erro buscando colaboradores:', colaboradoresError);
      else setColaboradores(colaboradoresData);
    };

    if (profile?.company_id) {
      fetchAgendamentos();
      fetchDropdownData();

      const interval = setInterval(() => {
        checkAndAutoUpdateStatus();
      }, 20000); // Roda a cada 20 segundos

      return () => clearInterval(interval); // Limpa o intervalo ao desmontar
    }
  }, [profile, supabase]); // Dependência corrigida, 'rows' removido

  const checkAndAutoUpdateStatus = async () => {
    if (!profile?.company_id) return;

    const now = new Date();
    const today = now.toISOString().split('T')[0]; // Formato YYYY-MM-DD

    // Busca apenas agendamentos que são candidatos à atualização
    const { data: candidates, error } = await supabase
      .from('agendamentos')
      .select('id, data, hora, status')
      .eq('company_id', profile.company_id)
      .in('status', ['Agendado', 'Confirmado'])
      .lte('data', today);

    if (error) {
      console.error('Erro buscando candidatos para auto-update:', error);
      return;
    }

    const updatedIds = [];
    for (const candidate of candidates) {
      const appointmentDateTime = new Date(`${candidate.data}T${candidate.hora}`);
      if (appointmentDateTime <= now) {
        // Faz a atualização no banco de dados
        const { error: updateError } = await supabase
          .from('agendamentos')
          .update({ status: 'Em Andamento' })
          .eq('id', candidate.id);

        if (updateError) {
          console.error(`Erro ao auto-atualizar status para o agendamento ${candidate.id}:`, updateError);
        } else {
          console.log(`Status do agendamento ${candidate.id} atualizado para "Em Andamento"`);
          updatedIds.push(candidate.id);
        }
      }
    }

    // Se houver agendamentos atualizados, atualiza o estado localmente
    if (updatedIds.length > 0) {
      setRows(currentRows =>
        currentRows.map(row =>
          updatedIds.includes(row.id)
            ? { ...row, status: 'Em Andamento' }
            : row
        )
      );
    }
  };

  const handleClienteSearch = async (event, value) => {
    if (!value || value.length < 2) {
      setClientes([]);
      return;
    }
    if (!profile?.company_id) return;

    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('company_id', profile.company_id)
      .ilike('nome', `%${value}%`);

    if (error) {
      console.error('Erro buscando clientes:', error);
    } else {
      setClientes(data);
    }
  };

  const handleOpenAddClient = () => setAddClientOpen(true);
  const handleCloseAddClient = () => setAddClientOpen(false);

  const handleNewClientChange = (field, value) => {
    setNewClient(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveNewClient = async () => {
    if (!newClient.nome) {
      enqueueSnackbar('O nome do cliente é obrigatório.', { variant: 'warning' });
      return;
    }
    if (!profile?.company_id) {
      enqueueSnackbar('Erro: ID da empresa não encontrado.', { variant: 'error' });
      return;
    }

    const placeholderEmail = `${newClient.nome.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}@placeholder.com`;

    const { data, error } = await supabase
      .from('clientes')
      .insert({
        nome: newClient.nome,
        telefone: newClient.telefone,
        email: placeholderEmail, // E-mail único gerado
        company_id: profile.company_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar novo cliente:', error);
      enqueueSnackbar('Não foi possível salvar o novo cliente.', { variant: 'error' });
    } else {
      enqueueSnackbar('Cliente salvo com sucesso!', { variant: 'success' });
      handleCloseAddClient();
      // Atualiza o formulário de agendamento com o cliente recém-criado
      setNewAppointment(prev => ({ ...prev, cliente: data }));
      // Adiciona o novo cliente à lista de opções para que ele apareça selecionado
      setClientes(prevClientes => [...prevClientes, data]);
    }
  };

  const handleClickOpen = () => {
    setNewAppointment({
      data: '',
      hora: '',
      cliente: null,
      servico: null,
      profissional: null,
      status: 'Agendado',
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleInputChange = (field, value) => {
    setNewAppointment(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!newAppointment.cliente || !newAppointment.servico || !newAppointment.profissional || !newAppointment.data || !newAppointment.hora) {
      enqueueSnackbar('Por favor, preencha todos os campos obrigatórios.', { variant: 'warning' });
      return;
    }
    
    if (!profile?.company_id) {
      enqueueSnackbar('Erro: ID da empresa não encontrado. Por favor, faça login novamente.', { variant: 'error' });
      return;
    }

    const { data, error } = await supabase.from('agendamentos').insert([
      {
        data: newAppointment.data,
        hora: newAppointment.hora,
        cliente_id: newAppointment.cliente.id,
        servico_id: newAppointment.servico.id,
        colaborador_id: newAppointment.profissional.id,
        status: newAppointment.status,
        company_id: profile.company_id,
      },
    ]).select().single(); // Adicionado .select().single() para retornar o item criado

    if (error) {
      console.error('Erro ao salvar agendamento:', error);
      enqueueSnackbar(`Não foi possível salvar: ${error.message}`, { variant: 'error' });
    } else {
      // Adiciona o novo agendamento diretamente ao estado 'rows'
      const newRow = {
        id: data.id,
        cliente_id: newAppointment.cliente.id, // Correção: Adiciona o ID do cliente
        data: newAppointment.data,
        hora: newAppointment.hora,
        nome: newAppointment.cliente.nome,
        servico: newAppointment.servico.nome,
        profissional: newAppointment.profissional.nome,
        status: newAppointment.status,
      };
      setRows(currentRows => [newRow, ...currentRows]);
      handleClose();
      enqueueSnackbar('Agendamento salvo com sucesso!', { variant: 'success' });
    }
  };

  const columns = [
    { 
      field: 'data', 
      headerName: 'Data', 
      width: 120,
      valueFormatter: (params) => {
        if (!params.value) return '';
        const [year, month, day] = params.value.split('-');
        return `${day}/${month}/${year}`;
      },
    },
    { field: 'hora', headerName: 'Hora', width: 100 },
    { field: 'nome', headerName: 'Nome', width: 200 },
    { field: 'telefone', headerName: 'Telefone', width: 150, hide: isMobile },
    { field: 'servico', headerName: 'Serviço', width: 200, hide: isMobile },
    { field: 'profissional', headerName: 'Profissional', width: 150, hide: isMobile },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params) => {
        const config = statusConfig[params.value] || { color: 'default', variant: 'outlined' };
        return <Chip label={params.value} color={config.color} variant={config.variant} size="small" />;
      },
    },
    {
      field: 'acoes',
      headerName: 'Ações',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton onClick={() => handleWhatsAppClick(params.row)} color="success">
            <WhatsAppIcon />
          </IconButton>
          <IconButton onClick={(e) => handleMenuClick(e, params.id)}>
            <MoreVertIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  const handleWhatsAppClick = (row) => {
    if (!row.telefone) {
      enqueueSnackbar('Este cliente não possui um número de telefone cadastrado.', { variant: 'warning' });
      return;
    }

    // 1. Formata o número: remove caracteres não numéricos e adiciona o código do país (55 para Brasil)
    const numeroLimpo = row.telefone.replace(/\D/g, '');
    const numeroInternacional = `55${numeroLimpo}`;

    // 2. Formata a data para DD/MM/YYYY
    const [year, month, day] = row.data.split('-');
    const dataFormatada = `${day}/${month}/${year}`;

    // 3. Monta a mensagem
    const mensagem = encodeURIComponent(
      `Olá, ${row.nome}! Gostaria de confirmar seu agendamento para o serviço de ${row.servico} no dia ${dataFormatada} às ${row.hora.substring(0, 5)}.`
    );

    // 4. Cria e abre o link do WhatsApp
    const url = `https://wa.me/${numeroInternacional}?text=${mensagem}`;
    window.open(url, '_blank');
  };

  const filteredRows = rows.filter((row) =>
    row.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 0 }}>
      <Paper elevation={0} sx={{ p: isMobile ? 2 : 4, height: '85vh', width: '100%' }}>
        <Box 
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            gap: 2
          }}
        >
          <Typography variant="h4" gutterBottom sx={{ mb: isMobile ? 2 : 0 }}>
            Agenda de Serviços
          </Typography>
          <Box 
            sx={{
              display: 'flex',
              flexDirection: isMobile ? 'column-reverse' : 'row',
              alignItems: 'center',
              gap: 2,
              width: isMobile ? '100%' : 'auto'
            }}
          >
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleClickOpen}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Novo Agendamento
              </Button>
              <Button
                variant="outlined"
                onClick={() => setBloqueioModalOpen(true)}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Bloquear Horários
              </Button>
              <Button
                variant="outlined"
                onClick={() => setVerHorariosModalOpen(true)}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Ver Horários
              </Button>
              <IconButton onClick={handleShareLink} color="primary" aria-label="Copiar link de agendamento">
                <LinkIcon />
              </IconButton>
            </Box>
            <TextField
              label="Buscar por Nome"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: isMobile ? '100%' : 'auto' }}
            />
          </Box>
        </Box>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 100 },
            },
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          checkboxSelection
          disableSelectionOnClick
          localeText={ptBR.components.MuiDataGrid.defaultProps.localeText}
        />
      </Paper>

      <GerenciadorBloqueiosModal
        open={isBloqueioModalOpen}
        onClose={() => setBloqueioModalOpen(false)}
        colaboradores={colaboradores}
        companyId={profile?.company_id}
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {Object.keys(statusConfig).map((status) => (
          <MenuItem key={status} onClick={() => handleStatusChange(status)}>
            {status}
          </MenuItem>
        ))}
        <MenuItem onClick={handleFidelidadeClick}>Fidelidade</MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          Excluir
        </MenuItem>
      </Menu>

      <PagamentoModal
        open={isPagamentoModalOpen}
        onClose={() => setPagamentoModalOpen(false)}
        agendamento={agendamentoParaPagamento}
        onPagamentoSuccess={() => {
          fetchAgendamentos(); // Recarrega a lista de agendamentos
        }}
      />

      <VerHorariosModal
        open={isVerHorariosModalOpen}
        onClose={() => setVerHorariosModalOpen(false)}
        profissionais={colaboradores}
        servicos={servicos}
        companyId={profile?.company_id}
      />

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Agendamento</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                label="Data"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={newAppointment.data}
                onChange={(e) => handleInputChange('data', e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Hora"
                type="time"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={newAppointment.hora}
                onChange={(e) => handleInputChange('hora', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={clientes}
                getOptionLabel={(option) => option.nome || ''}
                value={newAppointment.cliente}
                onChange={(e, value) => handleInputChange('cliente', value)}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Cliente" 
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {params.InputProps.endAdornment}
                          <IconButton onClick={handleOpenAddClient} edge="end">
                            <AddIcon />
                          </IconButton>
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={servicos}
                getOptionLabel={(option) => option.nome || ''}
                value={newAppointment.servico}
                onChange={(e, value) => handleInputChange('servico', value)}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => <TextField {...params} label="Serviço" />}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={colaboradores}
                getOptionLabel={(option) => option.nome || ''}
                value={newAppointment.profissional}
                onChange={(e, value) => handleInputChange('profissional', value)}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => <TextField {...params} label="Profissional" />}
              />
            </Grid>
            <Grid item xs={12}>
               <Autocomplete
                options={Object.keys(statusConfig)}
                onChange={(e, value) => handleInputChange('status', value)}
                renderInput={(params) => <TextField {...params} label="Status" />}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* Add Client Dialog */}
      <Dialog open={addClientOpen} onClose={handleCloseAddClient} maxWidth="xs" fullWidth>
        <DialogTitle>Adicionar Novo Cliente</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                margin="dense"
                label="Nome do Cliente"
                type="text"
                fullWidth
                variant="outlined"
                value={newClient.nome}
                onChange={(e) => handleNewClientChange('nome', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label="Telefone"
                type="text"
                fullWidth
                variant="outlined"
                value={newClient.telefone}
                onChange={(e) => handleNewClientChange('telefone', e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddClient}>Cancelar</Button>
          <Button onClick={handleSaveNewClient} variant="contained">Salvar Cliente</Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog for Deletion */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Confirmar Exclusão"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Fidelidade */}
      <Dialog open={isFidelidadeModalOpen} onClose={() => setFidelidadeModalOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>
          Programa de Fidelidade: {selectedClienteData.nome}
        </DialogTitle>
        <DialogContent>
          {loadingHistorico ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ width: '100%' }}>
              <Typography variant="h6" gutterBottom>Histórico de Agendamentos</Typography>
              {selectedClienteData.historico.length > 0 ? (
                <DataGrid
                  rows={selectedClienteData.historico.map(h => ({
                    id: h.id,
                    data: new Date(h.data).toLocaleDateString('pt-BR'),
                    servico: h.servicos?.nome || 'N/A',
                    valor: h.servicos?.valor ? `R$ ${h.servicos.valor.toFixed(2)}` : 'N/A',
                    status: h.status,
                  }))}
                  columns={[
                    { field: 'data', headerName: 'Data', width: 150 },
                    { field: 'servico', headerName: 'Serviço', flex: 1 },
                    { field: 'valor', headerName: 'Valor', width: 120 },
                    { field: 'status', headerName: 'Status', width: 150 },
                  ]}
                  pageSize={5}
                  rowsPerPageOptions={[5]}
                  autoHeight
                  disableSelectionOnClick
                />
              ) : (
                <Typography>Nenhum histórico encontrado para este cliente.</Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFidelidadeModalOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AgendaServicos;