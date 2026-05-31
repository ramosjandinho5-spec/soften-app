import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, CircularProgress } from '@mui/material';
import StatCard from '../components/StatCard';
import FaturamentoChart from '../components/FaturamentoChart';
import TopProdutosChart from '../components/TopProdutosChart';
import FluxoDeCaixaChart from '../components/FluxoDeCaixaChart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StoreIcon from '@mui/icons-material/Store';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import WelcomeModal from '../components/WelcomeModal'; // Importa o modal

// Função para formatar números como moeda brasileira
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

function Dashboard() {
  const { user, companyId } = useAuth(); // Pega o companyId do contexto
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [displayName, setDisplayName] = useState('');
  
  const initialSummaryData = [
    { title: 'Receita Total', value: 'R$ 0,00', percentage: '...', isPositive: true, icon: <AttachMoneyIcon sx={{ color: 'primary.main' }} /> },
    { title: 'Vendas', value: 'R$ 0,00', percentage: '...', isPositive: true, icon: <ShoppingCartIcon sx={{ color: 'success.main' }} /> },
    { title: 'Compras', value: 'R$ 0,00', percentage: '...', isPositive: false, icon: <StoreIcon sx={{ color: 'warning.main' }} /> },
    { title: 'Contas a Pagar', value: 'R$ 0,00', percentage: '...', isPositive: false, icon: <ReceiptIcon sx={{ color: 'error.main' }} /> },
    { title: 'Contas a Receber', value: 'R$ 0,00', percentage: '...', isPositive: true, icon: <AccountBalanceWalletIcon sx={{ color: 'secondary.main' }} /> },
  ];

  const [summaryData, setSummaryData] = useState(initialSummaryData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndSetData = async (currentCompanyId) => {
      if (!currentCompanyId) {
        setSummaryData(initialSummaryData);
        setDisplayName('');
        return; // Sai se não houver empresa
      }
      try {
        // A lógica de busca de dados permanece a mesma
        const { data: empresaData, error: empresaError } = await supabase
          .from('empresas')
          .select('tipo_pessoa, razao_social, nome_completo, nome_fantasia')
          .eq('id', currentCompanyId)
          .single();
        if (empresaError) throw empresaError;
        if (empresaData) {
          if (empresaData.tipo_pessoa === 'JURIDICA') setDisplayName(empresaData.razao_social);
          else if (empresaData.tipo_pessoa === 'FISICA') setDisplayName(empresaData.nome_fantasia || empresaData.nome_completo);
        }

        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
        const { data: vendasHojeData, error: vendasHojeError } = await supabase.from('vendas').select('valor_total').eq('company_id', currentCompanyId).eq('status', 'Finalizada').gte('created_at', startOfToday);
        if (vendasHojeError) throw vendasHojeError;
        const { data: vendasMesData, error: vendasMesError } = await supabase.from('vendas').select('valor_total').eq('company_id', currentCompanyId).eq('status', 'Finalizada').gte('created_at', startOfMonth);
        if (vendasMesError) throw vendasMesError;
        const { data: receitasHojeData, error: receitasHojeError } = await supabase.from('receitas').select('valor_final').eq('company_id', currentCompanyId).gte('data_pagamento', startOfToday);
        if (receitasHojeError) throw receitasHojeError;
        const { data: receitasMesData, error: receitasMesError } = await supabase.from('receitas').select('valor_final').eq('company_id', currentCompanyId).gte('data_pagamento', startOfMonth);
        if (receitasMesError) throw receitasMesError;
        const { data: comprasData, error: comprasError } = await supabase.from('compras').select('valor').eq('company_id', currentCompanyId).gte('created_at', startOfMonth);
        if (comprasError) throw comprasError;
        const { data: aPagarData, error: aPagarError } = await supabase.from('contas_a_pagar').select('valor').eq('status', 'pendente').eq('company_id', currentCompanyId);
        if (aPagarError) throw aPagarError;
        const { data: aReceberData, error: aReceberError } = await supabase.from('contas_a_receber').select('valor').eq('status', 'pendente').eq('company_id', currentCompanyId);
        if (aReceberError) throw aReceberError;

        const totalVendasHoje = vendasHojeData.reduce((acc, item) => acc + item.valor_total, 0);
        const totalReceitasServicosHoje = receitasHojeData.reduce((acc, item) => acc + item.valor_final, 0);
        const consolidadoHoje = totalVendasHoje + totalReceitasServicosHoje;
        const totalVendasMes = vendasMesData.reduce((acc, item) => acc + item.valor_total, 0);
        const totalReceitasServicosMes = receitasMesData.reduce((acc, item) => acc + item.valor_final, 0);
        const consolidadoMes = totalVendasMes + totalReceitasServicosMes;
        const totalCompras = comprasData.reduce((acc, item) => acc + item.valor, 0);
        const totalAPagar = aPagarData.reduce((acc, item) => acc + item.valor, 0);
        const totalAReceber = aReceberData.reduce((acc, item) => acc + item.valor, 0);

        setSummaryData([
          { title: 'Receita Total', value: formatCurrency(consolidadoMes), percentage: 'mês', isPositive: true, icon: <AttachMoneyIcon sx={{ color: 'primary.main' }} /> },
          { title: 'Vendas', value: formatCurrency(consolidadoHoje), percentage: 'hoje', isPositive: true, icon: <ShoppingCartIcon sx={{ color: 'success.main' }} /> },
          { title: 'Compras', value: formatCurrency(totalCompras), percentage: 'mês', isPositive: false, icon: <StoreIcon sx={{ color: 'warning.main' }} /> },
          { title: 'Contas a Pagar', value: formatCurrency(totalAPagar), percentage: 'pendente', isPositive: false, icon: <ReceiptIcon sx={{ color: 'error.main' }} /> },
          { title: 'Contas a Receber', value: formatCurrency(totalAReceber), percentage: 'pendente', isPositive: true, icon: <AccountBalanceWalletIcon sx={{ color: 'secondary.main' }} /> },
        ]);

      } catch (error) {
        console.error("Erro ao buscar detalhes do dashboard:", error);
        setSummaryData(initialSummaryData); // Em caso de erro, reseta para o estado inicial
      }
    };

    // Função de Carga Inicial (com spinner)
    const initialLoad = async () => {
      if (!companyId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      await fetchAndSetData(companyId);
      setLoading(false);
    };

    initialLoad(); // Executa a carga inicial

  }, [user, companyId]);

  const handleCloseWelcomeModal = async () => {
    setShowWelcomeModal(false);
    await supabase.auth.updateUser({
      data: { welcome_modal_seen: true }
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <WelcomeModal open={showWelcomeModal} onClose={handleCloseWelcomeModal} />

      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
        Olá, {user?.user_metadata?.full_name?.split(' ')[0] || 'Visitante'}!
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Aqui está um resumo das suas informações: <strong>{displayName}</strong>
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {summaryData.map((item, index) => (
            <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
              <StatCard {...item} />
            </Grid>
          ))}
        </Grid>
      )}

      <Grid container spacing={3} sx={{ mt: 4 }}>
        <Grid item xs={12} lg={7}>
          <FaturamentoChart />
        </Grid>
        <Grid item xs={12} lg={5}>
          <TopProdutosChart />
        </Grid>
        <Grid item xs={12}>
          <FluxoDeCaixaChart />
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;