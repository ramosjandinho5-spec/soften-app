import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartCard from './ChartCard';
import { supabase } from '../supabaseClient';
import EmptyChart from './EmptyChart';

import { useAuth } from '../contexts/AuthContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const TopProdutosChart = () => {
    const { companyId } = useAuth(); // Pega o companyId do contexto
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        const fetchAndSetData = async () => {
            if (!companyId) {
                setData([]);
                setTotal(0);
                return;
            }
            try {
                const startDate = `${selectedYear}-01-01`;
                const endDate = `${selectedYear}-12-31`;

                const { data: vendasData, error } = await supabase
                    .from('venda_itens')
                    .select('created_at, produtos!inner(name), quantidade, preco_unitario')
                    .eq('company_id', companyId)
                    .gte('created_at', startDate)
                    .lte('created_at', endDate);

                if (error) throw error;

                const productSales = vendasData.reduce((acc, item) => {
                    const productName = item.produtos.name;
                    const saleValue = item.quantidade * item.preco_unitario;
                    if (!acc[productName]) {
                        acc[productName] = 0;
                    }
                    acc[productName] += saleValue;
                    return acc;
                }, {});

                const sortedProducts = Object.entries(productSales)
                    .sort(([, a], [, b]) => b - a)
                    .map(([name, value]) => ({ name, value }));

                const top5 = sortedProducts.slice(0, 5);
                const totalValue = sortedProducts.reduce((acc, item) => acc + item.value, 0);

                setData(top5);
                setTotal(totalValue);
            } catch (error) {
                console.error("Erro ao buscar dados de top produtos:", error);
                setData([]);
                setTotal(0);
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
            <ChartCard title="Top Produtos" year={selectedYear} onYearChange={setSelectedYear}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                </Box>
            </ChartCard>
        );
    }

    if (data.length === 0 && !loading) {
        return (
            <ChartCard title="Top Produtos" year={selectedYear} onYearChange={setSelectedYear}>
                <EmptyChart />
            </ChartCard>
        );
    }

    return (
        <ChartCard title="Top Produtos" year={selectedYear} onYearChange={setSelectedYear}>
            <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={100}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            labelLine={false}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} />
                        <Legend
                            iconType="circle"
                            layout="horizontal"
                            verticalAlign="bottom"
                            align="center"
                            wrapperStyle={{ paddingTop: '20px' }}
                            payload={
                                data.map(
                                    (item, index) => ({
                                        value: item.name,
                                        type: 'circle',
                                        id: item.name,
                                        color: COLORS[index % COLORS.length]
                                    })
                                )
                            }
                        />
                    </PieChart>
                </ResponsiveContainer>
                <Box
                    sx={{
                        position: 'absolute',
                        top: '42%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center'
                    }}
                >
                    <Typography variant="body2" color="text.secondary">
                        Total
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                    </Typography>
                </Box>
            </Box>
        </ChartCard>
    );
};

export default TopProdutosChart;