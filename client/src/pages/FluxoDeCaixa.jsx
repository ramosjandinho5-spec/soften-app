import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Select, MenuItem, FormControl, InputLabel, CircularProgress, Paper, Card, CardContent } from '@mui/material';
import FluxoDeCaixaChart from '../components/FluxoDeCaixaChart';
import MovimentacoesTable from '../components/MovimentacoesTable';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import EmptyChart from '../components/EmptyChart';
import HistoricoSessaoModal from '../components/HistoricoSessaoModal';

// --- Funções Utilitárias ---
const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 5; i++) {
        years.push(currentYear - i);
    }
    return years;
};

const mesesCompletos = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const mesesAbreviados = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// --- Componente de Cartão de Estatística ---
const StatCard = ({ title, value, color }) => (
    <Card sx={{ backgroundColor: color, color: 'white', height: '100%' }}>
        <CardContent>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                {title}
            </Typography>
            <Typography variant="h4" sx={{ mt: 1 }}>
                {value}
            </Typography>
        </CardContent>
    </Card>
);

// --- Componente Principal da Página ---
const FluxoDeCaixa = () => {
    const { companyId } = useAuth();
    const [movimentacoes, setMovimentacoes] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [summary, setSummary] = useState({ entradas: 0, saidas: 0, saldo: 0 });
    const [loading, setLoading] = useState(true);
    const [periodo, setPeriodo] = useState('Anual');
    const [ano, setAno] = useState(new Date().getFullYear());
    const yearOptions = generateYearOptions();
    const [historicoSessaoOpen, setHistoricoSessaoOpen] = useState(false);
    const [selectedSessaoId, setSelectedSessaoId] = useState(null);

    useEffect(() => {
        const fetchFluxoDeCaixa = async () => {
            if (!companyId) return;
            setLoading(true);

            try {
                let startDate, endDate;
                if (periodo === 'Anual') {
                    startDate = `${ano}-01-01T00:00:00.000Z`;
                    endDate = `${ano}-12-31T23:59:59.999Z`;
                } else {
                    const monthIndex = periodo;
                    startDate = new Date(ano, monthIndex, 1).toISOString();
                    const lastDay = new Date(ano, monthIndex + 1, 0).getDate();
                    endDate = new Date(ano, monthIndex, lastDay, 23, 59, 59, 999).toISOString();
                }

                const { data, error } = await supabase
                    .from('fluxo_de_caixa')
                    .select('id, data_movimento, valor, tipo, descricao, usuario:usuario_id(full_name), detalhes_pagamento')
                    .like('descricao', 'Fechamento de Caixa%')
                    .eq('company_id', companyId)
                    .gte('data_movimento', startDate)
                    .lte('data_movimento', endDate)
                    .order('data_movimento', { ascending: false });

                if (error) throw error;
                setMovimentacoes(data || []);

                // Calcular Resumo
                let totalEntradas = 0;
                let totalSaidas = 0;
                data.forEach(item => {
                    if (item.tipo === 'ENTRADA') totalEntradas += item.valor;
                    else if (item.tipo === 'SAIDA') totalSaidas += item.valor;
                });
                setSummary({ entradas: totalEntradas, saidas: totalSaidas, saldo: totalEntradas - totalSaidas });

                // Preparar dados para o gráfico
                if (periodo === 'Anual') {
                    const monthlyData = mesesAbreviados.map(mes => ({ name: mes, Entradas: 0, Saidas: 0 }));
                    data.forEach(item => {
                        const monthIndex = new Date(item.data_movimento).getMonth();
                        if (item.tipo === 'ENTRADA') monthlyData[monthIndex].Entradas += item.valor;
                        else if (item.tipo === 'SAIDA') monthlyData[monthIndex].Saidas += item.valor;
                    });
                    setChartData(monthlyData);
                } else {
                    const monthIndex = periodo;
                    const numDays = new Date(ano, monthIndex + 1, 0).getDate();
                    const dailyData = Array.from({ length: numDays }, (_, i) => ({ name: `${i + 1}`, Entradas: 0, Saidas: 0 }));
                    data.forEach(item => {
                        const dayIndex = new Date(item.data_movimento).getDate() - 1;
                        if (item.tipo === 'ENTRADA') dailyData[dayIndex].Entradas += item.valor;
                        else if (item.tipo === 'SAIDA') dailyData[dayIndex].Saidas += item.valor;
                    });
                    setChartData(dailyData);
                }

            } catch (error) {
                console.error("Erro ao buscar dados de fluxo de caixa:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFluxoDeCaixa();
    }, [ano, periodo, companyId]);

    const handleOpenHistorico = (descricao) => {
        const match = descricao.match(/Sessão #([a-f0-9-]+)/);
        if (match && match[1]) {
            setSelectedSessaoId(match[1]);
            setHistoricoSessaoOpen(true);
        } else {
            console.warn("Não foi possível extrair o ID da sessão da descrição:", descricao);
        }
    };

    const handleCloseHistorico = () => {
        setHistoricoSessaoOpen(false);
        setSelectedSessaoId(null);
    };

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Cabeçalho e Filtros */}
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: { xs: 'flex-start', sm: 'center' }, 
                flexDirection: { xs: 'column', sm: 'row' },
                mb: 3 
            }}>
                <Typography variant={{ xs: 'h5', sm: 'h4' }} gutterBottom sx={{ mb: { xs: 2, sm: 0 } }}>
                    Análise de Fluxo de Caixa
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', sm: 'auto' } }}>
                    <FormControl size="small" fullWidth>
                        <InputLabel>Período</InputLabel>
                        <Select value={periodo} label="Período" onChange={(e) => setPeriodo(e.target.value)}>
                            <MenuItem value={'Anual'}>Anual</MenuItem>
                            {mesesCompletos.map((mes, index) => <MenuItem key={index} value={index}>{mes}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small" fullWidth>
                        <InputLabel>Ano</InputLabel>
                        <Select value={ano} label="Ano" onChange={(e) => setAno(e.target.value)}>
                            {yearOptions.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Box>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    {/* Cartões de Resumo */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} sm={4}>
                            <StatCard title="Total de Entradas" value={formatCurrency(summary.entradas)} color="#4CAF50" />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <StatCard title="Total de Saídas" value={formatCurrency(summary.saidas)} color="#F44336" />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <StatCard title="Saldo" value={formatCurrency(summary.saldo)} color={summary.saldo >= 0 ? '#2196F3' : '#FF9800'} />
                        </Grid>
                    </Grid>

                    {/* Gráfico */}
                    <Paper sx={{ p: 2, mb: 4 }}>
                        {chartData.some(d => d.Entradas > 0 || d.Saidas > 0) ? (
                            <FluxoDeCaixaChart data={chartData} />
                        ) : (
                            <EmptyChart message="Sem dados de gráfico para exibir no período." />
                        )}
                    </Paper>

                    {/* Tabela de Movimentações */}
                    <MovimentacoesTable data={movimentacoes} onOpenDetails={handleOpenHistorico} />

                    <HistoricoSessaoModal
                        open={historicoSessaoOpen}
                        onClose={handleCloseHistorico}
                        sessaoId={selectedSessaoId}
                    />
                </>
            )}
        </Box>
    );
};

export default FluxoDeCaixa;