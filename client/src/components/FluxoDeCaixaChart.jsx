import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { supabase } from '../supabaseClient'; 
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';
import ChartCard from './ChartCard';
import EmptyChart from './EmptyChart';

const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const FluxoDeCaixaChart = () => {
    const { companyId } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        const fetchFluxoDeCaixa = async () => {
            if (!companyId) return;

            setLoading(true);
            try {
                const { data: fluxoData, error } = await supabase
                    .from('fluxo_de_caixa')
                    .select('data_movimento, valor, tipo')
                    .eq('company_id', companyId)
                    .gte('data_movimento', `${selectedYear}-01-01`)
                    .lte('data_movimento', `${selectedYear}-12-31`);

                if (error) throw error;

                const monthlyData = meses.map((mes) => ({
                    name: mes,
                    Entradas: 0,
                    Saidas: 0,
                }));

                fluxoData.forEach(item => {
                    const monthIndex = new Date(item.data_movimento).getMonth();
                    if (item.tipo === 'ENTRADA') {
                        monthlyData[monthIndex].Entradas += item.valor;
                    } else if (item.tipo === 'SAIDA') {
                        monthlyData[monthIndex].Saidas += item.valor;
                    }
                });

                setData(monthlyData);

            } catch (error) {
                console.error("Erro ao buscar dados de fluxo de caixa para o gráfico:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFluxoDeCaixa();
    }, [companyId, selectedYear]);

    if (loading) {
        return (
            <ChartCard title="Fluxo de Caixa (Anual)" year={selectedYear} onYearChange={setSelectedYear}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                </Box>
            </ChartCard>
        );
    }

    const hasData = data.some(d => d.Entradas > 0 || d.Saidas > 0);

    if (!hasData) {
        return (
            <ChartCard title="Fluxo de Caixa (Anual)" year={selectedYear} onYearChange={setSelectedYear}>
                <EmptyChart message="Sem dados de fluxo de caixa para exibir no período."/>
            </ChartCard>
        );
    }

    return (
        <ChartCard title="Fluxo de Caixa (Anual)" year={selectedYear} onYearChange={setSelectedYear}>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short' }).format(value)} />
                    <Tooltip formatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} />
                    <Legend />
                    <Bar dataKey="Entradas" fill="#4CAF50" />
                    <Bar dataKey="Saidas" fill="#F44336" />
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
    );
};

export default FluxoDeCaixaChart;