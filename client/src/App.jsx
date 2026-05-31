import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation, Link as RouterLink, useNavigate, useOutletContext } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import { AuthProvider, useAuth } from './contexts/AuthContext'; // Importando o AuthProvider

import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import CadastroPF from './pages/CadastroPF';
import Produtos from './pages/Produtos';
import Servicos from './pages/Servicos';
import Colaboradores from './pages/Colaboradores';
import CadastroProduto from './pages/CadastroProduto';
import CadastroServicos from './pages/CadastroServicos';
import CadastroColaborador from './pages/CadastroColaborador';
import AgendaServicos from './pages/AgendaServicos';
import AgendamentoPublico from './pages/AgendamentoPublico';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Welcome from './pages/Welcome';
import AcceptInvite from './pages/AcceptInvite'; // Importa a nova página
import ProtectedRoute from './components/ProtectedRoute';
import ProfileMenu from './components/ProfileMenu';
import SettingsMenu from './components/SettingsMenu';
import Perfil from './pages/Perfil';
import Empresa from './pages/Empresa';
import AdminPanel from './pages/AdminPanel';
import UserManagement from './pages/UserManagement';
import SystemSettings from './pages/SystemSettings'; // Importa a nova página
import HomeTutorial from './pages/HomeTutorial'; // Importa a nova página
import Vendas from './pages/Vendas';
import NovaVenda from './pages/NovaVenda';
import Orcamentos from './pages/Orcamentos';
import NovoOrcamento from './pages/NovoOrcamento';
import OrcamentosServicos from './pages/OrcamentosServicos';
import NovoOrcamentoServico from './pages/NovoOrcamentoServico';
import Caixa from './pages/Caixa';
import FluxoDeCaixa from './pages/FluxoDeCaixa';
import UpdatePassword from './pages/UpdatePassword';
import SwitchCompany from './pages/SwitchCompany';
import NewCompany from './pages/NewCompany';
import Sidebar from './components/Sidebar';
import { CssBaseline, Box, Toolbar, AppBar, Typography, IconButton, Breadcrumbs, Link, useTheme, useMediaQuery, Popover } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { CalendarPicker } from '@mui/x-date-pickers/CalendarPicker';
import MenuIcon from '@mui/icons-material/Menu';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

const drawerWidth = 240;

// Mapeamento de rotas para nomes amigáveis
const breadcrumbNameMap = {
  '/dashboard': 'Dashboard',
  '/clientes': 'Clientes',
  '/produtos': 'Produtos',
  '/servicos': 'Serviços',
  '/colaboradores': 'Colaboradores',
  '/agenda-servicos': 'Agenda de Serviços',
  '/perfil': 'Meu Perfil',
  '/empresa': 'Cadastro da Empresa',
  '/admin': 'Painel Administrativo',
  '/admin/users': 'Gerenciamento de Usuários',
};

import CompanyRequiredModal from './components/CompanyRequiredModal';

// Layout principal com Sidebar e AppBar que renderiza rotas filhas
const MainLayout = () => {
  const { user, supabase } = useAuth();
  const { profile } = useOutletContext(); // Pega o profile do ProtectedRoute
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(!isTablet);
  const [calendarAnchorEl, setCalendarAnchorEl] = useState(null);
  const location = useLocation();
  const [hasCompany, setHasCompany] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  useEffect(() => {
    if (!user) {
      setHasCompany(false);
      return;
    }

    const checkCompany = async () => {
      const { data, error } = await supabase
        .from('empresas') // O NOME CORRETO DA TABELA!
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (data && data.length > 0) {
        setHasCompany(true);
      } else {
        setHasCompany(false);
      }
    };

    checkCompany();
  }, [user, supabase]);

  const handleCalendarClick = (event) => {
    setCalendarAnchorEl(event.currentTarget);
  };

  const handleCalendarClose = () => {
    setCalendarAnchorEl(null);
  };

  const isCalendarOpen = Boolean(calendarAnchorEl);

  useEffect(() => {
    setOpen(!isTablet);
  }, [isTablet]);

  const navigate = useNavigate();

  const toggleDrawer = () => {
    setOpen(!open);
  }

  const handleDrawerClose = () => {
    if (isTablet) {
      setOpen(false);
    }
  };

  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <CompanyRequiredModal open={showCompanyModal} onClose={() => setShowCompanyModal(false)} />
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${open ? drawerWidth : 60}px)`,
          ml: `${open ? drawerWidth : 60}px`,
          backgroundColor: '#FFFFFF',
          color: '#212121',
          boxShadow: 'none',
          borderBottom: '1px solid #E0E0E0',
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={toggleDrawer}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, color: 'primary.main' }}>
            {profile?.full_name || user?.email}
          </Typography>
          {profile?.role === 'admin' && (
            <IconButton color="inherit" onClick={() => window.open('/admin', '_blank')}>
              <AdminPanelSettingsIcon />
            </IconButton>
          )}
          <IconButton onClick={handleCalendarClick}>
            <CalendarMonthIcon sx={{ color: 'action.active' }} />
          </IconButton>
          <SettingsMenu />
          <ProfileMenu />
        </Toolbar>
      </AppBar>
      <Popover
        open={isCalendarOpen}
        anchorEl={calendarAnchorEl}
        onClose={handleCalendarClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <CalendarPicker date={new Date()} onChange={() => {}} />
      </Popover>
      <Sidebar open={open} handleDrawerClose={handleDrawerClose} hasCompany={hasCompany} onMenuClick={() => setShowCompanyModal(true)} />
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          bgcolor: '#F4F6F8', 
          p: 3, 
          height: '100vh', 
          overflow: 'auto'
        }}
      >
        <Toolbar />
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link component={RouterLink} underline="hover" color="inherit" to="/dashboard">
            Início
          </Link>
          {pathnames.map((value, index) => {
            const last = index === pathnames.length - 1;
            const to = `/${pathnames.slice(0, index + 1).join('/')}`;
            const name = breadcrumbNameMap[to] || value.charAt(0).toUpperCase() + value.slice(1);

            return last ? (
              <Typography color="text.primary" key={to}>
                {name}
              </Typography>
            ) : (
              <Link component={RouterLink} underline="hover" color="inherit" to={to} key={to}>
                {name}
              </Link>
            );
          })}
        </Breadcrumbs>
        <Outlet context={{ profile }} />
      </Box>
    </Box>
  );
};

function AppContent() {
  const { supabase } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session && !session.user.last_sign_in_at) {
        navigate('/welcome');
      } else if (event === 'USER_UPDATED' && window.location.pathname === '/accept-invite') {
        // Após o usuário definir a senha na tela de convite, ele é redirecionado
        navigate('/dashboard');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, navigate]);

  return (
    <Routes>
      {/* Rotas públicas que não precisam de login */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/update-password" element={<UpdatePassword />} />
      <Route path="/accept-invite" element={<AcceptInvite />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/agendar/:slugDaEmpresa" element={<AgendamentoPublico />} />
      
      {/* Agrupador de rotas protegidas */}
      <Route element={<ProtectedRoute />}>
        {/* Rotas que usam o MainLayout e exigem login */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cadastro-pf" element={<CadastroPF />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/servicos" element={<Servicos />} />
          <Route path="/colaboradores" element={<Colaboradores />} />
          <Route path="/agenda-servicos" element={<AgendaServicos />} />
          <Route path="/produtos/cadastro" element={<CadastroProduto />} />
          <Route path="/produtos/cadastro/:id" element={<CadastroProduto />} />
          <Route path="/servicos/cadastro" element={<CadastroServicos />} />
          <Route path="/servicos/cadastro/:id" element={<CadastroServicos />} />
          <Route path="/colaboradores/cadastro" element={<CadastroColaborador />} />
          <Route path="/colaboradores/cadastro/:id" element={<CadastroColaborador />} />
          <Route path="/vendas" element={<Vendas />} />
          <Route path="/vendas/nova" element={<NovaVenda />} />
          <Route path="/orcamentos" element={<Orcamentos />} />
          <Route path="/orcamentos/novo" element={<NovoOrcamento />} />
          <Route path="/orcamentos/editar/:id" element={<NovoOrcamento />} />
          <Route path="/orcamentos-servicos" element={<OrcamentosServicos />} />
          <Route path="/novo-orcamento-servico" element={<NovoOrcamentoServico />} />
          <Route path="/orcamentos-servicos/editar/:id" element={<NovoOrcamentoServico />} />
          <Route path="/financeiro/caixa" element={<Caixa />} />
          <Route path="/financeiro/fluxo-de-caixa" element={<FluxoDeCaixa />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/empresa" element={<Empresa />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/settings" element={<SystemSettings />} />
          <Route path="/admin/home-tutorial" element={<HomeTutorial />} />
          <Route path="/trocar-empresa" element={<SwitchCompany />} />
          <Route path="/cadastrar-empresa" element={<NewCompany />} />
        </Route>
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <SnackbarProvider maxSnack={3}>
      <Router>
        <AuthProvider>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <AppContent />
          </LocalizationProvider>
        </AuthProvider>
      </Router>
    </SnackbarProvider>
  );
}

export default App;