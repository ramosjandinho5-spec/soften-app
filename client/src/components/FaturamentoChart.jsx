import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartCard from './ChartCard';
import { supabase } from '../supabaseClient';
import EmptyChart from './EmptyChart';
import { Box, CircularProgress, Typography } from '@mui/material';

import { useAuth } from '../contexts/AuthContext';

const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const FaturamentoChart = () => {
    const { companyId } = useAuth(); // Pega o companyId do contexto
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        const fetchAndSetData = async () => {
            if (!companyId) {
                setData([]);
                return;
            }
            try {
                const startDate = `${selectedYear}-01-01`;
                const endDate = `${selectedYear}-12-31`;

                const { data: vendasData, error } = await supabase
                    .from('vendas')
                    .select('created_at, valor_total')
                    .eq('company_id', companyId)
                    .gte('created_at', startDate)
                    .lte('created_at', endDate);

                if (error) throw error;

                const monthlyData = meses.map((mes, index) => ({
                    name: mes,
                    Faturamento: 0,
                    Meta: [2400, 1398, 9800, 3908, 4800, 3800, 4300, 5300, 6300, 5300, 4300, 6200][index],
                }));

                vendasData.forEach(venda => {
                    const monthIndex = new Date(venda.created_at).getMonth();
                    monthlyData[monthIndex].Faturamento += venda.valor_total;
                });

                setData(monthlyData);
            } catch (error) {
                console.error("Erro ao buscar dados de faturamento:", error);
                setData([]);
            }
        };

        const initialLoad = async () => {
            if (!companyId) {
                setLoading(false);
                return;
            }
            setLoading(true);
            await fetchAndSetData();
            setLoading(false);
        };

        initialLoad();

        const interval = setInterval(fetchAndSetData, 5000);
        return () => clearInterval(interval);

    }, [selectedYear, companyId]);


    if (loading) {
        return (
            <ChartCard title="Faturamento" year={selectedYear} onYearChange={setSelectedYear}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                </Box>
            </ChartCard>
        );
    }
    
    const hasData = data.some(d => d.Faturamento > 0);

    if (!hasData && !loading) {
        return (
            <ChartCard title="Faturamento" year={selectedYear} onYearChange={setSelectedYear}>
                <EmptyChart />
            </ChartCard>
        );
    }

    return (
        <ChartCard title="Faturamento" year={selectedYear} onYearChange={setSelectedYear}>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <defs>
                        <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="Faturamento" stroke="#8884d8" strokeWidth={2} fillOpacity={1} fill="url(#colorFaturamento)" />
                    <Line type="monotone" dataKey="Meta" stroke="#82ca9d" strokeDasharray="5 5" />
                </LineChart>
            </ResponsiveContainer>
        </ChartCard>
    );
};

export default FaturamentoChart;