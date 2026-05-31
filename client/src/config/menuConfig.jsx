import React from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import InventoryIcon from '@mui/icons-material/Inventory';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import GroupIcon from '@mui/icons-material/Group';
import WidgetsIcon from '@mui/icons-material/Widgets';
import MiscellaneousServicesIcon from '@mui/icons-material/MiscellaneousServices';
import BadgeIcon from '@mui/icons-material/Badge';
import EventIcon from '@mui/icons-material/Event';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentIcon from '@mui/icons-material/Payment';
import TimelineIcon from '@mui/icons-material/Timeline';

// Esta é a Fonte Única da Verdade para a navegação e os módulos da aplicação.
export const menuConfig = [
  { id: 'dashboard', text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  {
    id: 'cadastros',
    text: 'Cadastros',
    icon: <GroupIcon />,
    subItems: [
      { id: 'clientes', text: 'Clientes', icon: <PeopleIcon />, path: '/clientes' },
      { id: 'produtos', text: 'Produtos', icon: <WidgetsIcon />, path: '/produtos' },
      { id: 'servicos', text: 'Serviços', icon: <MiscellaneousServicesIcon />, path: '/servicos' },
      { id: 'colaboradores', text: 'Colaboradores', icon: <BadgeIcon />, path: '/colaboradores' },
    ]
  },
  {
    id: 'vendas_group',
    text: 'Vendas',
    icon: <PointOfSaleIcon />,
    subItems: [
      { id: 'vendas', text: 'Vendas', icon: <PointOfSaleIcon />, path: '/vendas' },
      { id: 'orcamentos', text: 'Orçamentos', icon: <RequestQuoteIcon />, path: '/orcamentos' },
    ]
  },
  {
    id: 'financeiro_group',
    text: 'Financeiro',
    icon: <AttachMoneyIcon />,
    subItems: [
      { id: 'caixa', text: 'Caixa', icon: <PointOfSaleIcon />, path: '/financeiro/caixa' },
      { id: 'contas_receber', text: 'Contas a Receber', icon: <ReceiptIcon />, path: '/financeiro/contas-a-receber' },
      { id: 'contas_pagar', text: 'Contas a Pagar', icon: <PaymentIcon />, path: '/financeiro/contas-a-pagar' },
      { id: 'fluxo_caixa', text: 'Fluxo de Caixa', icon: <TimelineIcon />, path: '/financeiro/fluxo-de-caixa' },
    ]
  },
  {
    id: 'estoque_group',
    text: 'Estoque',
    icon: <InventoryIcon />,
    subItems: [
      { id: 'compras', text: 'Compras', icon: <ShoppingCartIcon />, path: '/compras' },
    ]
  },
  {
    id: 'agenda_group',
    text: 'Agenda',
    icon: <EventIcon />,
    subItems: [
      { id: 'agenda_servicos', text: 'Agenda de Serviços', icon: <EventIcon />, path: '/agenda-servicos' },
      { id: 'orcamentos_servicos', text: 'Orçamentos de Serviços', icon: <RequestQuoteIcon />, path: '/orcamentos-servicos' },
    ]
  },
  { id: 'relatorios', text: 'Relatórios', icon: <AssessmentIcon />, path: '/relatorios' },
  { id: 'configuracoes', text: 'Configurações', icon: <SettingsIcon />, path: '/configuracoes' },
];