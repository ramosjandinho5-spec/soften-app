import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Grid,
  Paper,
  GlobalStyles,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  IconButton,
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Link as RouterLink } from 'react-router-dom';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import ReceiptOutlinedIcon from '@mui/icons-material/ReceiptOutlined';
import StayCurrentPortraitOutlinedIcon from '@mui/icons-material/StayCurrentPortraitOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import SyncAltOutlinedIcon from '@mui/icons-material/SyncAltOutlined';
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import PersonSearchOutlinedIcon from '@mui/icons-material/PersonSearchOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import { InputAdornment } from '@mui/material';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import TabletMacIcon from '@mui/icons-material/TabletMac';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import logo from '../assets/images/logo.png.png.png';
import { supabase } from '../supabaseClient';

const features = [
  {
    icon: <Inventory2OutlinedIcon fontSize="large" color="primary" />,
    title: 'Controle de Estoque',
    description: 'Gerencie entradas, saídas e níveis de estoque em tempo real.',
  },
  {
    icon: <AccountBalanceWalletOutlinedIcon fontSize="large" color="primary" />,
    title: 'Gestão Financeira',
    description: 'Controle contas, faturamento, despesas e fluxo de caixa da sua empresa.',
  },
  {
    icon: <BarChartOutlinedIcon fontSize="large" color="primary" />,
    title: 'Relatórios Inteligentes',
    description: 'Visualize métricas e resultados com dashboards modernos e personalizáveis.',
  },
];

const erpBenefits = [
  {
    icon: <StorageOutlinedIcon sx={{ fontSize: 40, color: '#90CAF9' }} />,
    title: 'Centralização de Dados',
    description: 'Acesse todas as informações da sua empresa em um único lugar, eliminando planilhas e sistemas isolados.',
  },
  {
    icon: <AutorenewOutlinedIcon sx={{ fontSize: 40, color: '#90CAF9' }} />,
    title: 'Automação de Processos',
    description: 'Reduza tarefas manuais, automatize rotinas e ganhe tempo para focar no que realmente importa: seu negócio.',
  },
  {
    icon: <InsightsOutlinedIcon sx={{ fontSize: 40, color: '#90CAF9' }} />,
    title: 'Decisões Estratégicas',
    description: 'Com dados precisos e em tempo real, tome decisões mais inteligentes e impulsione o crescimento da sua empresa.',
  },
];

function getYouTubeID(url) {
  const arr = url.split(/(vi\/|v%3D|v=|\/v\/|youtu\.be\/|\/embed\/)/);
  return undefined !== arr[2] ? arr[2].split(/[?&]/)[0] : arr[0];
}

const Landing = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [openWhatsAppModal, setOpenWhatsAppModal] = React.useState(false);
  const [whatsAppForm, setWhatsAppForm] = React.useState({
    name: '',
    phone: '',
    subject: '',
  });
  const [homeVideoId, setHomeVideoId] = React.useState('');
  const [openDemoModal, setOpenDemoModal] = React.useState(false);
  const [demoForm, setDemoForm] = React.useState({
    name: '',
    phone: '',
    date: '',
    time: '',
  });

  React.useEffect(() => {
    const fetchHomeVideoLink = async () => {
      const { data, error } = await supabase
        .from('config')
        .select('home_video_link')
        .single();

      if (error) {
        console.error('Error fetching home video link:', error);
      } else if (data && data.home_video_link) {
        setHomeVideoId(getYouTubeID(data.home_video_link));
      }
    };

    fetchHomeVideoLink();
  }, []);

  const handleOpenWhatsAppModal = () => {
    setOpenWhatsAppModal(true);
  };

  const handleCloseWhatsAppModal = () => {
    setOpenWhatsAppModal(false);
    setWhatsAppForm({ name: '', phone: '', subject: '' }); // Reset form
  };

  const handleWhatsAppFormChange = (e) => {
    const { id, value } = e.target;
    setWhatsAppForm(prevState => ({ ...prevState, [id]: value }));
  };

  const handleSendWhatsApp = () => {
    const yourNumber = '5517981778473';
    const message = `Olá! Meu nome é ${whatsAppForm.name}.
Telefone para contato: ${whatsAppForm.phone}
Assunto: ${whatsAppForm.subject}`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${yourNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    handleCloseWhatsAppModal();
  };



  const handleOpenDemoModal = () => {
    setOpenDemoModal(true);
  };

  const handleCloseDemoModal = () => {
    setOpenDemoModal(false);
    setDemoForm({ name: '', phone: '', date: '', time: '' });
  };

  const handleDemoFormChange = (e) => {
    const { id, value } = e.target;
    setDemoForm(prevState => ({ ...prevState, [id]: value }));
  };

  const handleSendDemoRequest = () => {
    const yourNumber = '5517981778473';
    const message = `Olá! Gostaria de agendar uma demonstração.\nNome: ${demoForm.name}\nTelefone: ${demoForm.phone}\nData: ${demoForm.date}\nHorário: ${demoForm.time}`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${yourNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    handleCloseDemoModal();
  };

  return (
    <>
      <GlobalStyles styles={{
        '@keyframes pulse': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.03)' },
          '100%': { transform: 'scale(1)' },
        },
        '@keyframes shine': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'body::-webkit-scrollbar': {
          display: 'none',
        },
        'body': {
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }
      }} />
      <Box sx={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }}>
        {/* Header */}
        <AppBar
          position="static"
          color="transparent"
          elevation={0}
          sx={{}}
        >
          <Toolbar sx={{ justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', py: isMobile ? 2 : 0 }}>
            <Box sx={{
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.05)'
              },
              mb: isMobile ? 2 : 0,
            }}>
              <img src={logo} alt="Logo" style={{ height: '140px', display: 'block' }} />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<WhatsAppIcon />}
                sx={{ mb: isMobile ? 1 : 0, mr: isMobile ? 0 : 2, width: isMobile ? '100%' : 'auto' }}
                onClick={handleOpenWhatsAppModal}
              >
                WhatsApp
              </Button>
              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                disableElevation
                sx={{ width: isMobile ? '100%' : 'auto' }}
              >
                Entrar na conta
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Hero Section */}
        <Container maxWidth="lg" sx={{ mt: 8, textAlign: 'center' }}>
          <Typography
            variant="h2"
            component="h1"
            sx={{ 
              fontWeight: 'bold', 
              mb: 2, 
              color: '#10466b',
              fontSize: { xs: '2.2rem', sm: '3rem', md: '3.75rem' } 
            }}
          >
            Gerencie sua empresa com mais{' '}
            <span style={{ color: '#1976D2' }}>controle, velocidade e simplicidade.</span>
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4, fontSize: { xs: '1rem', sm: '1.125rem' } }}>
            Tudo o que sua empresa precisa para vender mais e manter a gestão em dia, de forma simples e integrada.
          </Typography>
          <Button
            component={RouterLink}
            to="/login"
            variant="contained"
            size="large"
            sx={{ 
              mt: 2,
              fontWeight: 'bold',
              padding: '10px 30px',
              fontSize: '1.1rem',
              borderRadius: '8px',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.2s ease-in-out, background-color 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.05)',
                backgroundColor: '#1565C0',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '200%',
                height: '100%',
                background: 'linear-gradient(120deg, rgba(255,255,255,0) 20%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 80%)',
                animation: 'shine 3s linear infinite',
              },
            }}
          >
            Teste grátis por 5 dias
          </Button>
        </Container>

        {/* Features Section */}
        <Container maxWidth="lg" sx={{ mt: 8, mb: 8 }}>
          <Grid container spacing={4} justifyContent="center">
            {features.map((feature) => (
              <Grid item xs={12} sm={4} md={4} key={feature.title}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    borderRadius: '12px',
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.23)',
                    transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 24px rgba(0,0,0,0.12)',
                      '& .icon-box': {
                        transform: 'scale(1.2)',
                      },
                    },
                  }}
                >
                  <Box className="icon-box" sx={{ mb: 2, transition: 'transform 0.3s ease-in-out' }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>

        {/* Blue Section */}
        <Box sx={{ backgroundColor: '#0D1B2A', color: '#FFFFFF', py: 16 }}>
          <Container maxWidth="lg" disableGutters>
            <Typography variant="h4" component="h2" sx={{ textAlign: 'center', fontWeight: 'bold', mb: 6, fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' } }}>
              Todas as ferramentas do seu ERP em um só sistema completo
            </Typography>
            <Grid container spacing={4} justifyContent="center">
              {erpBenefits.map((benefit) => (
                <Grid item xs={12} sm={4} md={4} key={benefit.title}>
                  <Paper
                    elevation={4}
                    sx={{
                      p: 4,
                      backgroundColor: '#1B263B',
                      color: '#FFFFFF',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      transition: 'transform 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        '& .icon-box-blue': {
                          transform: 'scale(1.2)',
                        },
                      },
                    }}
                  >
                    <Box className="icon-box-blue" sx={{ mb: 2, transition: 'transform 0.3s ease-in-out' }}>
                      {benefit.icon}
                    </Box>
                    <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {benefit.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#E0E0E0' }}>
                      {benefit.description}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* Video Section */}
        <Box sx={{ mt: 8, mb: 8 }}>
          <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
            <Typography
              variant="h4"
              component="h2"
              sx={{ fontWeight: 'bold', mb: 4, color: '#10466b' }}
            >
              Conheça o ERP simples e facil com mais controle, mais produtividade e mais resultados.
            </Typography>
          </Container>
          <Box sx={{ px: { xs: 2, sm: 4 } }}>
            <Grid container spacing={2} alignItems="stretch" justifyContent="space-between">
              <Grid item xs={12} md={2} sx={{ display: 'flex' }}>
                <Box sx={{
                  textAlign: 'center',
                  backgroundColor: '#1B263B',
                  color: '#FFFFFF',
                  p: 3,
                  borderRadius: '16px',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'pulse 4s infinite ease-in-out',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.3), 0 6px 6px rgba(0,0,0,0.35)',
                  border: '1px solid #34495E',
                }}>
                  <DesktopWindowsIcon sx={{ fontSize: 40, color: '#90CAF9', mx: 'auto' }} />
                  <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', mt: 1, color: '#FFFFFF' }}>
                    Acesso Desktop
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, color: '#B0BEC5' }}>
                    Aproveite a experiência completa da nossa plataforma no seu computador.
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={7}>
                <Box
                  sx={{
                    border: '2px solid #90CAF9',
                    borderRadius: '16px',
                    p: 1.5,
                    backgroundColor: '#0D1B2A',
                    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2), 0 5px 15px rgba(0, 0, 0, 0.1)',
                    transition: 'transform 0.4s ease, box-shadow 0.4s ease',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      boxShadow: '0 25px 45px rgba(0, 0, 0, 0.25), 0 10px 20px rgba(0, 0, 0, 0.15)',
                    },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '500px', // Adjust height as needed
                  }}
                >
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '12px',
                      overflow: 'hidden',
                    }}
                  >
                    {homeVideoId ? (
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${homeVideoId}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    ) : (
                      <Typography variant="h5" color="#fff">
                        (Vídeo será exibido aqui)
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={2} sx={{ display: 'flex' }}>
                <Box sx={{
                  textAlign: 'center',
                  backgroundColor: '#1B263B',
                  color: '#FFFFFF',
                  p: 3,
                  borderRadius: '16px',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'pulse 4s infinite ease-in-out',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.3), 0 6px 6px rgba(0,0,0,0.35)',
                  border: '1px solid #34495E',
                }}>
                  <Box>
                    <TabletMacIcon sx={{ fontSize: 40, color: '#90CAF9' }} />
                    <PhoneIphoneIcon sx={{ fontSize: 40, color: '#90CAF9', ml: 1 }} />
                  </Box>
                  <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', mt: 1, color: '#FFFFFF' }}>
                    Acesso Móvel
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, color: '#B0BEC5' }}>
                    Leve seu negócio com você. Acesse de qualquer tablet ou celular.
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              sx={{
                mt: 4,
                fontWeight: 'bold',
                padding: '10px 30px',
                fontSize: '1.1rem',
                borderRadius: '8px',
                position: 'relative',
                overflow: 'hidden',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(100deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                  transform: 'translateX(-100%)',
                  animation: 'shine 3s infinite linear',
                },
                '@keyframes shine': {
                  '0%': {
                    transform: 'translateX(-100%)',
                  },
                  '100%': {
                    transform: 'translateX(100%)',
                  },
                },
              }}
              onClick={handleOpenDemoModal}
            >
              Agendar Demonstração
            </Button>
          </Box>
        </Box>

        {/* Call to Action Section */}
        <Box sx={{ backgroundColor: '#0D1B2A', py: 12, mt: 8, color: '#FFFFFF', textAlign: 'center' }}>
          <Container maxWidth="lg">
            <Stack spacing={4}>
              {[
                {
                  icon: <PeopleOutlineIcon sx={{ fontSize: 48, color: '#90CAF9' }} />,
                  title: 'Público Abrangente',
                  description: 'Nossa plataforma é ideal tanto para Pessoas Físicas quanto para Pessoas Jurídicas que buscam organização e controle.',
                },
                {
                  icon: <RequestQuoteOutlinedIcon sx={{ fontSize: 48, color: '#90CAF9' }} />,
                  title: 'Foco no Essencial (Não Fiscal)',
                  description: 'Nosso sistema é voltado para a gestão não fiscal, simplificando a vida do pequeno empreendedor sem a complexidade dos impostos.',
                },
                {
                  icon: <EventAvailableOutlinedIcon sx={{ fontSize: 48, color: '#90CAF9' }} />,
                  title: 'Agenda Online Inteligente',
                  description: 'Gerencie seus compromissos e de sua equipe com uma agenda online completa, dando total controle sobre os horários agendados.',
                },
              ].map((item, index) => (
                <Paper
                  key={index}
                  elevation={6}
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    borderRadius: '16px',
                    backgroundColor: '#1B263B',
                    border: '1px solid #34495E',
                    transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-10px)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                    },
                  }}
                >
                  {item.icon}
                  <Typography variant="h5" component="h3" sx={{ fontWeight: 'bold', mt: 2, mb: 1, color: '#FFFFFF' }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body1" color="#B0BEC5">
                    {item.description}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          </Container>
        </Box>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            py: 3,
            px: 2,
            mt: 'auto',
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid #E0E0E0',
          }}
        >
          <Container maxWidth="lg">
            <Typography variant="body2" color="text.secondary" align="center">
              {'© '}
              2026
              {' OrganizaÊ - JR Web Solutions'}
            </Typography>
          </Container>
        </Box>
      </Box>
      <Dialog
        open={openWhatsAppModal}
        onClose={handleCloseWhatsAppModal}
        fullScreen={isMobile}
        PaperProps={!isMobile ? {
          sx: {
            borderRadius: '16px',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            padding: '16px',
          }
        } : {}}
      >
        {isMobile ? (
          <AppBar sx={{ position: 'relative' }}>
            <Toolbar>
              <IconButton edge="start" color="inherit" onClick={handleCloseWhatsAppModal} aria-label="close">
                <CloseIcon />
              </IconButton>
              <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                Contato via WhatsApp
              </Typography>
              <Button autoFocus color="inherit" onClick={handleSendWhatsApp}>
                Enviar
              </Button>
            </Toolbar>
          </AppBar>
        ) : (
          <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.5rem' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <WhatsAppIcon color="primary" />
              Contato via WhatsApp
            </Box>
          </DialogTitle>
        )}
        <DialogContent sx={isMobile ? { pt: 2 } : {}}>
          {!isMobile && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
              Preencha os campos abaixo e nossa equipe entrará em contato.
            </Typography>
          )}
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Nome"
            type="text"
            fullWidth
            variant="outlined"
            value={whatsAppForm.name}
            onChange={handleWhatsAppFormChange}
            sx={{ mt: isMobile ? 2 : 0 }}
          />
          <TextField
            margin="dense"
            id="phone"
            label="Telefone"
            type="tel"
            fullWidth
            variant="outlined"
            value={whatsAppForm.phone}
            onChange={handleWhatsAppFormChange}
          />
          <TextField
            margin="dense"
            id="subject"
            label="Assunto"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={whatsAppForm.subject}
            onChange={handleWhatsAppFormChange}
          />
        </DialogContent>
        {!isMobile && (
          <DialogActions sx={{ padding: '0 24px 16px' }}>
            <Button onClick={handleCloseWhatsAppModal}>Cancelar</Button>
            <Button onClick={handleSendWhatsApp} variant="contained">Enviar</Button>
          </DialogActions>
        )}
      </Dialog>

      {/* Demo Modal */}
      <Dialog open={openDemoModal} onClose={handleCloseDemoModal} fullWidth maxWidth="sm">
        <DialogTitle>
          Agendar Demonstração
          <IconButton
            aria-label="close"
            onClick={handleCloseDemoModal}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Seu Nome"
            type="text"
            fullWidth
            variant="outlined"
            value={demoForm.name}
            onChange={handleDemoFormChange}
          />
          <TextField
            margin="dense"
            id="phone"
            label="Seu Telefone"
            type="tel"
            fullWidth
            variant="outlined"
            value={demoForm.phone}
            onChange={handleDemoFormChange}
          />
          <TextField
            margin="dense"
            id="date"
            label="Data da Demonstração"
            type="date"
            fullWidth
            variant="outlined"
            InputLabelProps={{
              shrink: true,
            }}
            value={demoForm.date}
            onChange={handleDemoFormChange}
          />
          <TextField
            margin="dense"
            id="time"
            label="Horário da Demonstração"
            type="time"
            fullWidth
            variant="outlined"
            InputLabelProps={{
              shrink: true,
            }}
            value={demoForm.time}
            onChange={handleDemoFormChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDemoModal}>Cancelar</Button>
          <Button onClick={handleSendDemoRequest} variant="contained">Agendar</Button>
        </DialogActions>
      </Dialog>

      {/* Demo Modal */}
      <Dialog 
        open={openDemoModal} 
        onClose={handleCloseDemoModal}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            padding: '16px',
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.5rem', color: '#0d47a1' }}>
          Agendar Demonstração
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="normal"
            id="name"
            label="Nome"
            type="text"
            fullWidth
            variant="outlined"
            value={demoForm.name}
            onChange={handleDemoFormChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutlineIcon />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            margin="normal"
            id="phone"
            label="Telefone"
            type="text"
            fullWidth
            variant="outlined"
            value={demoForm.phone}
            onChange={handleDemoFormChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneOutlinedIcon />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            margin="normal"
            id="date"
            label="Data"
            type="date"
            fullWidth
            variant="outlined"
            InputLabelProps={{
              shrink: true,
            }}
            value={demoForm.date}
            onChange={handleDemoFormChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarTodayOutlinedIcon />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            margin="normal"
            id="time"
            label="Horário"
            type="time"
            fullWidth
            variant="outlined"
            InputLabelProps={{
              shrink: true,
            }}
            value={demoForm.time}
            onChange={handleDemoFormChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AccessTimeOutlinedIcon />
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', paddingBottom: '16px' }}>
          <Button onClick={handleCloseDemoModal} sx={{ color: 'text.secondary' }}>Cancelar</Button>
          <Button onClick={handleSendDemoRequest} variant="contained" sx={{ borderRadius: '8px' }}>Agendar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Landing;