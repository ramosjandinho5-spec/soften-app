import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Paper, Typography, Button, Grid, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Modal, TextField, InputAdornment } from '@mui/material';
import { AddCircleOutline, RemoveCircleOutline, ArrowUpward, ArrowDownward, CalendarToday } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

const Caixa = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, companyId } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [caixaState, setCaixaState] = useState({
    aberto: false,
    sessaoId: null,
    abertoEm: null,
    operador: null,
    saldoAtual: 0,
    movimentacoes: [],
    // Adicione outros campos conforme necessário
  });

  const [openAbrirCaixa, setOpenAbrirCaixa] = useState(false);
  const [valorInicial, setValorInicial] = useState('');
  const [openSangria, setOpenSangria] = useState(false);
  const [valorSangria, setValorSangria] = useState('');
  const [observacaoSangria, setObservacaoSangria] = useState('');
  const [openSuprimento, setOpenSuprimento] = useState(false);
  const [valorSuprimento, setValorSuprimento] = useState('');
  const [observacaoSuprimento, setObservacaoSuprimento] = useState('');

  const [openFecharCaixa, setOpenFecharCaixa] = useState(false);
  const [valorFinal, setValorFinal] = useState('');
  const [observacaoFechamento, setObservacaoFechamento] = useState('');

  const handleOpenAbrirCaixa = () => {
    setValorInicial('');
    setOpenAbrirCaixa(true);
  };
  
  const handleCloseAbrirCaixa = () => setOpenAbrirCaixa(false);

  const handleConfirmarAbertura = async () => {
    if (!valorInicial || isNaN(parseFloat(valorInicial))) {
      enqueueSnackbar('Por favor, insira um valor inicial válido.', { variant: 'warning' });
      return;
    }

    if (!companyId) {
      enqueueSnackbar('Erro: ID da empresa não encontrado. Por favor, faça login novamente.', { variant: 'error' });
      return;
    }

    try {
      // 1. Verificar se já existe um caixa aberto
      const { data: caixaAberto, error: checkError } = await supabase
        .from('caixa_sessoes')
        .select('id')
        .eq('company_id', companyId)
        .eq('status', 'ABERTO')
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116: no rows found, o que é bom neste caso
        throw checkError;
      }

      if (caixaAberto) {
        enqueueSnackbar('Já existe um caixa aberto para esta empresa.', { variant: 'info' });
        return;
      }

      // 2. Inserir a nova sessão de caixa
      const { data: novaSessao, error: sessaoError } = await supabase
        .from('caixa_sessoes')
        .insert({
          company_id: companyId,
          usuario_id: user.id,
          valor_inicial: parseFloat(valorInicial),
          status: 'ABERTO',
          data_abertura: new Date(),
        })
        .select()
        .single();

      if (sessaoError) throw sessaoError;

      // 3. Inserir a movimentação de abertura
      const { error: movimentacaoError } = await supabase
        .from('caixa_movimentacoes')
        .insert({
          sessao_id: novaSessao.id,
          company_id: companyId,
          usuario_id: user.id,
          tipo: 'ABERTURA',
          valor: parseFloat(valorInicial),
          descricao: 'Abertura de caixa',
          data_movimentacao: new Date(),
        });

      if (movimentacaoError) throw movimentacaoError;

      enqueueSnackbar('Caixa aberto com sucesso!', { variant: 'success' });
      handleCloseAbrirCaixa();
      carregarDadosDoCaixa(); // Recarrega os dados para atualizar a UI

    } catch (error) {
      console.error('Erro ao abrir o caixa:', error);
      enqueueSnackbar(`Erro ao abrir o caixa: ${error.message}`, { variant: 'error' });
    }
  };

  const handleOpenSangria = () => {
    setValorSangria('');
    setObservacaoSangria('');
    setOpenSangria(true);
  };

  const handleCloseSangria = () => setOpenSangria(false);

  const handleConfirmarSangria = async () => {
    if (!valorSangria || isNaN(parseFloat(valorSangria))) {
      enqueueSnackbar('Por favor, insira um valor de sangria válido.', { variant: 'warning' });
      return;
    }

    if (!companyId) {
      enqueueSnackbar('Erro: ID da empresa não encontrado. Por favor, faça login novamente.', { variant: 'error' });
      return;
    }

    try {
      // 1. Verificar se existe um caixa aberto e obter o ID da sessão
      const { data: caixaAberto, error: checkError } = await supabase
        .from('caixa_sessoes')
        .select('id')
        .eq('company_id', companyId)
        .eq('status', 'ABERTO')
        .single();

      if (checkError || !caixaAberto) {
        enqueueSnackbar('Não há um caixa aberto para realizar a sangria.', { variant: 'info' });
        return;
      }

      // 2. Inserir a movimentação de sangria
      const { error: movimentacaoError } = await supabase
        .from('caixa_movimentacoes')
        .insert({
          sessao_id: caixaAberto.id,
          company_id: companyId,
          usuario_id: user.id,
          tipo: 'SANGRIA',
          valor: -Math.abs(parseFloat(valorSangria)), // Garante que o valor seja negativo
          descricao: observacaoSangria || 'Sangria de caixa',
          data_movimentacao: new Date(),
        });

      if (movimentacaoError) throw movimentacaoError;

      enqueueSnackbar('Sangria realizada com sucesso!', { variant: 'success' });
      handleCloseSangria();
      carregarDadosDoCaixa(); // Recarrega os dados para atualizar a UI

    } catch (error) {
      console.error('Erro ao realizar a sangria:', error);
      enqueueSnackbar(`Erro ao realizar a sangria: ${error.message}`, { variant: 'error' });
    }
  };

  const handleOpenSuprimento = () => {
    setValorSuprimento('');
    setObservacaoSuprimento('');
    setOpenSuprimento(true);
  };

  const carregarDadosDoCaixa = useCallback(async () => {
    if (!companyId) return;

    try {
      // 1. Buscar a sessão de caixa aberta
      const { data: sessao, error: sessaoError } = await supabase
        .from('caixa_sessoes')
        .select('*, profiles(full_name)') // Inclui o nome do operador
        .eq('company_id', companyId)
        .eq('status', 'ABERTO')
        .single();

      if (sessaoError && sessaoError.code !== 'PGRST116') {
        throw sessaoError;
      }

      if (sessao) {
        // 2. Se houver sessão, buscar as movimentações
        const { data: movimentacoes, error: movError } = await supabase
          .from('caixa_movimentacoes')
          .select('*, profiles(full_name)')
          .eq('sessao_id', sessao.id)
          .order('data_movimentacao', { ascending: false });

        if (movError) throw movError;

        let movimentacoesCompletas = movimentacoes || [];

        // Extrai os IDs das vendas a partir da descrição
        const vendasIds = movimentacoes
          .filter(m => m.tipo === 'VENDA' && m.descricao && m.descricao.includes('Referente à Venda #'))
          .map(m => m.descricao.split('#')[1]);

        if (vendasIds.length > 0) {
          // Busca as formas de pagamento para as vendas encontradas
          const { data: vendasData, error: vendasError } = await supabase
            .from('vendas')
            .select('id, forma_pagamento')
            .in('id', vendasIds);

          if (vendasError) throw vendasError;

          // Mapeia a forma de pagamento de volta para a movimentação
          movimentacoesCompletas = movimentacoes.map(mov => {
            if (mov.tipo === 'VENDA' && mov.descricao && mov.descricao.includes('Referente à Venda #')) {
              const vendaId = parseInt(mov.descricao.split('#')[1], 10);
              const vendaCorrespondente = vendasData.find(v => v.id === vendaId);
              return {
                ...mov,
                forma_pagamento: vendaCorrespondente ? vendaCorrespondente.forma_pagamento : null,
              };
            }
            return mov;
          });
        }

        // 3. Calcular o saldo atual
        const saldoAtual = movimentacoesCompletas.reduce((acc, mov) => acc + mov.valor, 0);

        // 4. Atualizar o estado
        setCaixaState({
          aberto: true,
          sessaoId: sessao.id,
          abertoEm: new Date(sessao.data_abertura).toLocaleString(),
          operador: sessao.profiles.full_name,
          saldoAtual: saldoAtual,
          movimentacoes: movimentacoesCompletas,
        });

      } else {
        // 5. Se não houver sessão aberta
        setCaixaState({
          aberto: false,
          sessaoId: null,
          abertoEm: null,
          operador: null,
          saldoAtual: 0,
          movimentacoes: [],
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados do caixa:', error);
      enqueueSnackbar(`Erro ao carregar dados do caixa: ${error.message}`, { variant: 'error' });
    }
  }, [companyId, enqueueSnackbar]);

  useEffect(() => {
    carregarDadosDoCaixa();
  }, [carregarDadosDoCaixa]);

  const fechamentoCaixaCalculado = useMemo(() => {
    if (!caixaState.aberto) {
      return {
        saldoInicial: 0,
        totalVendas: 0,
        totalSangrias: 0,
        totalSuprimentos: 0,
        saldoEsperado: 0,
      };
    }

    const saldoInicial = caixaState.movimentacoes.find(m => m.tipo === 'ABERTURA')?.valor || 0;
    const totalVendas = caixaState.movimentacoes
      .filter(m => m.tipo === 'VENDA')
      .reduce((acc, m) => acc + m.valor, 0);
    const totalSangrias = caixaState.movimentacoes
      .filter(m => m.tipo === 'SANGRIA')
      .reduce((acc, m) => acc + m.valor, 0);
    const totalSuprimentos = caixaState.movimentacoes
      .filter(m => m.tipo === 'SUPRIMENTO')
      .reduce((acc, m) => acc + m.valor, 0);

    const saldoEsperado = saldoInicial + totalVendas + totalSangrias + totalSuprimentos;

    return {
      saldoInicial,
      totalVendas,
      totalSangrias,
      totalSuprimentos,
      saldoEsperado,
    };
  }, [caixaState.aberto, caixaState.movimentacoes]);

  const handleCloseSuprimento = () => setOpenSuprimento(false);

  const handleConfirmarSuprimento = async () => {
    if (!valorSuprimento || isNaN(parseFloat(valorSuprimento))) {
      enqueueSnackbar('Por favor, insira um valor de suprimento válido.', { variant: 'warning' });
      return;
    }

    if (!companyId) {
      enqueueSnackbar('Erro: ID da empresa não encontrado. Por favor, faça login novamente.', { variant: 'error' });
      return;
    }

    try {
      // 1. Verificar se existe um caixa aberto e obter o ID da sessão
      const { data: caixaAberto, error: checkError } = await supabase
        .from('caixa_sessoes')
        .select('id')
        .eq('company_id', companyId)
        .eq('status', 'ABERTO')
        .single();

      if (checkError || !caixaAberto) {
        enqueueSnackbar('Não há um caixa aberto para realizar o suprimento.', { variant: 'info' });
        return;
      }

      // 2. Inserir a movimentação de suprimento
      const { error: movimentacaoError } = await supabase
        .from('caixa_movimentacoes')
        .insert({
          sessao_id: caixaAberto.id,
          company_id: companyId,
          usuario_id: user.id,
          tipo: 'SUPRIMENTO',
          valor: Math.abs(parseFloat(valorSuprimento)), // Garante que o valor seja positivo
          descricao: observacaoSuprimento || 'Suprimento de caixa',
          data_movimentacao: new Date(),
        });

      if (movimentacaoError) throw movimentacaoError;

      enqueueSnackbar('Suprimento realizado com sucesso!', { variant: 'success' });
      handleCloseSuprimento();
      carregarDadosDoCaixa(); // Recarrega os dados para atualizar a UI

    } catch (error) {
      console.error('Erro ao realizar o suprimento:', error);
      enqueueSnackbar(`Erro ao realizar o suprimento: ${error.message}`, { variant: 'error' });
    }
  };

  const handleOpenFecharCaixa = () => {
    setValorFinal('');
    setObservacaoFechamento('');
    setOpenFecharCaixa(true);
  };

  const handleCloseFecharCaixa = () => setOpenFecharCaixa(false);

  const handleConfirmarFechamento = async () => {
    if (!valorFinal || isNaN(parseFloat(valorFinal))) {
      enqueueSnackbar('Por favor, insira um valor final válido.', { variant: 'warning' });
      return;
    }

    if (!caixaState.sessaoId) {
      enqueueSnackbar('Erro: ID da sessão de caixa não encontrado.', { variant: 'error' });
      return;
    }

    const valorFinalNum = parseFloat(valorFinal);
    const diferenca = valorFinalNum - caixaState.saldoAtual;

    try {
      const { error } = await supabase
        .from('caixa_sessoes')
        .update({
          status: 'FECHADO',
          data_fechamento: new Date(),
          valor_final_informado: valorFinalNum,
          diferenca: diferenca,
          observacao_fechamento: observacaoFechamento,
        })
        .eq('id', caixaState.sessaoId);

      if (error) throw error;

      // Adicionar registro ao fluxo de caixa
      const { error: fluxoError } = await supabase.from('fluxo_de_caixa').insert({
        company_id: companyId,
        tipo: 'ENTRADA',
        valor: valorFinalNum,
        descricao: 'Fechamento de Caixa',
        data_movimento: new Date(),
        usuario_id: user.id,
        origem_id: caixaState.sessaoId,
        origem_tabela: 'caixa_sessoes',
      });

      if (fluxoError) {
        // Mesmo que o fluxo de caixa falhe, o caixa foi fechado.
        // Apenas notifique o usuário sobre o erro no fluxo de caixa.
        console.error('Erro ao registrar no fluxo de caixa:', fluxoError);
        enqueueSnackbar(`Caixa fechado, mas falha ao registrar no fluxo de caixa: ${fluxoError.message}`, { variant: 'error' });
      } else {
        enqueueSnackbar('Caixa fechado e registrado no fluxo de caixa com sucesso!', { variant: 'success' });
      }
      
      handleCloseFecharCaixa();
      carregarDadosDoCaixa(); // Recarrega os dados para atualizar a UI

    } catch (error) {
      console.error('Erro ao fechar o caixa:', error);
      enqueueSnackbar(`Erro ao fechar o caixa: ${error.message}`, { variant: 'error' });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Caixa Atual */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Caixa Atual</Typography>
            {caixaState.aberto ? (
              <>
                <Typography variant="body2">Aberto em: {caixaState.abertoEm}</Typography>
                <Typography variant="body2">Operador: {caixaState.operador}</Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant={isMobile ? 'h5' : 'h4'}>R$ {caixaState.saldoAtual.toFixed(2)}</Typography>
                {/* Lógica para detalhar por tipo de pagamento pode ser adicionada aqui */}
                <Button variant="contained" fullWidth sx={{ mt: 2 }} disabled={!caixaState.aberto} onClick={handleOpenFecharCaixa}>Fechar Caixa</Button>
              </>
            ) : (
              <Typography variant="h5" sx={{ my: 2 }}>Caixa Fechado</Typography>
            )}
          </Paper>
        </Grid>

        {/* Ações Rápidas */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Ações Rápidas</Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Button variant="outlined" fullWidth startIcon={<AddCircleOutline />} onClick={handleOpenAbrirCaixa} disabled={caixaState.aberto}>Abrir Caixa</Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button variant="outlined" fullWidth startIcon={<RemoveCircleOutline />} disabled={!caixaState.aberto} onClick={handleOpenFecharCaixa}>Fechar Caixa</Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button variant="outlined" fullWidth startIcon={<ArrowDownward />} onClick={handleOpenSangria} disabled={!caixaState.aberto}>Sangria</Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button variant="outlined" fullWidth startIcon={<ArrowUpward />} onClick={handleOpenSuprimento} disabled={!caixaState.aberto}>Suprimento</Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Últimas Movimentações */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Últimas Movimentações</Typography>
              <Button size="small" disabled={!caixaState.aberto}>Ver todas</Button>
            </Box>
            {isMobile ? (
              <Box sx={{ maxHeight: 400, overflowY: 'auto', mt: 2 }}>
                {caixaState.movimentacoes.map((mov) => (
                  <Paper key={mov.id} sx={{ p: 1.5, mb: 1.5, '&:last-child': { mb: 0 } }}>
                    <Grid container spacing={1} alignItems="center">
                      <Grid item xs={7}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {mov.descricao}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(mov.data_movimentacao).toLocaleString('pt-BR')}
                        </Typography>
                      </Grid>
                      <Grid item xs={5} sx={{ textAlign: 'right' }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: mov.valor < 0 ? 'error.main' : 'success.main' }}>
                          {mov.valor < 0 ? '-' : '+'} R$ {Math.abs(mov.valor).toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                          <Chip 
                            label={mov.tipo} 
                            size="small" 
                            color={mov.tipo === 'VENDA' ? 'success' : mov.tipo === 'SANGRIA' ? 'error' : mov.tipo === 'ABERTURA' ? 'info' : 'default'} 
                          />
                          {mov.forma_pagamento && <Chip label={mov.forma_pagamento} size="small" variant="outlined" />}
                          <Typography variant="caption" color="text.secondary">{mov.profiles.full_name}</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Descrição</TableCell>
                      <TableCell>Forma de Pag.</TableCell>
                      <TableCell align="right">Valor</TableCell>
                      <TableCell>Horário</TableCell>
                      <TableCell>Operador</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {caixaState.movimentacoes.map((mov) => (
                      <TableRow key={mov.id} hover>
                        <TableCell>
                          <Chip 
                            label={mov.tipo} 
                            size="small" 
                            color={mov.tipo === 'VENDA' ? 'success' : mov.tipo === 'SANGRIA' ? 'error' : mov.tipo === 'ABERTURA' ? 'info' : 'default'} 
                          />
                        </TableCell>
                        <TableCell>{mov.descricao}</TableCell>
                        <TableCell>{mov.forma_pagamento || '---'}</TableCell>
                        <TableCell align="right" sx={{ color: mov.valor < 0 ? 'error.main' : 'success.main', fontWeight: 'medium' }}>
                          R$ {mov.valor.toFixed(2)}
                        </TableCell>
                        <TableCell>{new Date(mov.data_movimentacao).toLocaleTimeString()}</TableCell>
                        <TableCell>{mov.profiles.full_name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* Fechamento de Caixa */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Fechamento de Caixa</Typography>
              <IconButton size="small"><CalendarToday /></IconButton>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Grid container justifyContent="space-between">
                <Typography variant="body1">Saldo inicial</Typography>
                <Typography variant="body1">R$ {fechamentoCaixaCalculado.saldoInicial.toFixed(2)}</Typography>
              </Grid>
              <Grid container justifyContent="space-between">
                <Typography variant="body1">Total de vendas</Typography>
                <Typography variant="body1">R$ {fechamentoCaixaCalculado.totalVendas.toFixed(2)}</Typography>
              </Grid>
              <Grid container justifyContent="space-between">
                <Typography variant="body1">Total de sangrias</Typography>
                <Typography variant="body1" sx={{ color: 'error.main' }}>R$ {fechamentoCaixaCalculado.totalSangrias.toFixed(2)}</Typography>
              </Grid>
              <Grid container justifyContent="space-between">
                <Typography variant="body1">Total de suprimentos</Typography>
                <Typography variant="body1" sx={{ color: 'success.main' }}>+ R$ {fechamentoCaixaCalculado.totalSuprimentos.toFixed(2)}</Typography>
              </Grid>
              <Divider sx={{ my: 1 }} />
              <Grid container justifyContent="space-between">
                <Typography variant="h6">Saldo esperado</Typography>
                <Typography variant="h6">R$ {caixaState.saldoAtual.toFixed(2)}</Typography>
              </Grid>
              <Grid container justifyContent="space-between">
                <Typography variant="body1">Saldo final (informado)</Typography>
                <Typography variant="body1">R$ {(0).toFixed(2)}</Typography>
              </Grid>
              <Grid container justifyContent="space-between" sx={{ mt: 1, p: 1, backgroundColor: 'transparent' }}>
                <Typography variant="body1">Diferença</Typography>
                <Typography variant="body1">R$ {(0).toFixed(2)}</Typography>
              </Grid>
            </Box>
            <Button variant="contained" fullWidth sx={{ mt: 2 }}>Gerar Relatório de Fechamento</Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Modal Abrir Caixa */}
      <Modal
        open={openAbrirCaixa}
        onClose={handleCloseAbrirCaixa}
        aria-labelledby="modal-abrir-caixa-title"
        aria-describedby="modal-abrir-caixa-description"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
        }}>
          <Typography id="modal-abrir-caixa-title" variant="h6" component="h2">
            Abrir Caixa
          </Typography>
          <Typography id="modal-abrir-caixa-description" sx={{ mt: 2 }}>
            Informe o valor inicial para o troco.
          </Typography>
          <TextField
            fullWidth
            label="Valor Inicial"
            sx={{ mt: 2 }}
            type="number"
            value={valorInicial}
            onChange={(e) => setValorInicial(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">R$</InputAdornment>,
            }}
          />
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleCloseAbrirCaixa}>Cancelar</Button>
            <Button variant="contained" sx={{ ml: 2 }} onClick={handleConfirmarAbertura}>Confirmar Abertura</Button>
          </Box>
        </Box>
      </Modal>

      {/* Modal Sangria */}
      <Modal
        open={openSangria}
        onClose={handleCloseSangria}
        aria-labelledby="modal-sangria-title"
        aria-describedby="modal-sangria-description"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
        }}>
          <Typography id="modal-sangria-title" variant="h6" component="h2">
            Realizar Sangria
          </Typography>
          <Typography id="modal-sangria-description" sx={{ mt: 2 }}>
            Informe o valor a ser retirado do caixa e uma observação (opcional).
          </Typography>
          <TextField
            fullWidth
            label="Valor da Sangria"
            sx={{ mt: 2 }}
            type="number"
            value={valorSangria}
            onChange={(e) => setValorSangria(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">R$</InputAdornment>,
            }}
          />
          <TextField
            fullWidth
            label="Observação"
            sx={{ mt: 2 }}
            multiline
            rows={3}
            value={observacaoSangria}
            onChange={(e) => setObservacaoSangria(e.target.value)}
          />
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleCloseSangria}>Cancelar</Button>
            <Button variant="contained" color="error" sx={{ ml: 2 }} onClick={handleConfirmarSangria}>Confirmar Sangria</Button>
          </Box>
        </Box>
      </Modal>

      {/* Modal Suprimento */}
      <Modal
        open={openSuprimento}
        onClose={handleCloseSuprimento}
        aria-labelledby="modal-suprimento-title"
        aria-describedby="modal-suprimento-description"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
        }}>
          <Typography id="modal-suprimento-title" variant="h6" component="h2">
            Realizar Suprimento
          </Typography>
          <Typography id="modal-suprimento-description" sx={{ mt: 2 }}>
            Informe o valor a ser adicionado ao caixa e uma observação (opcional).
          </Typography>
          <TextField
            fullWidth
            label="Valor do Suprimento"
            sx={{ mt: 2 }}
            type="number"
            value={valorSuprimento}
            onChange={(e) => setValorSuprimento(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">R$</InputAdornment>,
            }}
          />
          <TextField
            fullWidth
            label="Observação"
            sx={{ mt: 2 }}
            multiline
            rows={3}
            value={observacaoSuprimento}
            onChange={(e) => setObservacaoSuprimento(e.target.value)}
          />
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleCloseSuprimento}>Cancelar</Button>
            <Button variant="contained" color="success" sx={{ ml: 2 }} onClick={handleConfirmarSuprimento}>Confirmar Suprimento</Button>
          </Box>
        </Box>
      </Modal>

      {/* Modal Fechar Caixa */}
      <Modal
        open={openFecharCaixa}
        onClose={handleCloseFecharCaixa}
        aria-labelledby="modal-fechar-caixa-title"
        aria-describedby="modal-fechar-caixa-description"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
        }}>
          <Typography id="modal-fechar-caixa-title" variant="h6" component="h2">
            Fechar Caixa
          </Typography>
          
          <Box sx={{ my: 2 }}>
            <Grid container justifyContent="space-between">
              <Typography variant="body1">Saldo Esperado:</Typography>
              <Typography variant="body1">R$ {caixaState.saldoAtual.toFixed(2)}</Typography>
            </Grid>
          </Box>

          <TextField
            fullWidth
            label="Valor Final Informado"
            sx={{ mt: 2 }}
            type="number"
            value={valorFinal}
            onChange={(e) => setValorFinal(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">R$</InputAdornment>,
            }}
          />

          <Box sx={{ my: 2 }}>
            <Grid container justifyContent="space-between">
              <Typography variant="body1">Diferença:</Typography>
              <Typography 
                variant="body1" 
                sx={{ color: (parseFloat(valorFinal) || 0) - caixaState.saldoAtual !== 0 ? 'error.main' : 'success.main' }}
              >
                R$ {((parseFloat(valorFinal) || 0) - caixaState.saldoAtual).toFixed(2)}
              </Typography>
            </Grid>
          </Box>

          <TextField
            fullWidth
            label="Observação"
            sx={{ mt: 2 }}
            multiline
            rows={2}
            value={observacaoFechamento}
            onChange={(e) => setObservacaoFechamento(e.target.value)}
          />
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleCloseFecharCaixa}>Cancelar</Button>
            <Button variant="contained" sx={{ ml: 2 }} onClick={handleConfirmarFechamento}>Confirmar Fechamento</Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default Caixa;