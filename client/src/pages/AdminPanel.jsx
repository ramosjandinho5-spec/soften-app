import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Card, CardActionArea, CardContent, Container } from '@mui/material';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import HomeIcon from '@mui/icons-material/Home';

const adminModules = [
  {
    title: 'Usuários e Empresas',
    description: 'Gerencie usuários, permissões e dados das empresas.',
    icon: <PeopleAltIcon sx={{ fontSize: 40 }} />,
    path: '/admin/settings',
  },
  {
    title: 'Logs de Atividade',
    description: 'Visualize os logs de atividade dos usuários.',
    icon: <ReceiptLongIcon sx={{ fontSize: 40 }} />,
    path: '/admin/logs',
  },
  {
    title: 'Análises e Relatórios',
    description: 'Acesse relatórios e análises administrativas.',
    icon: <AnalyticsIcon sx={{ fontSize: 40 }} />,
    path: '/admin/analytics',
  },
  {
    title: 'Home e tutorial',
    description: 'Gerencie a página inicial e os tutoriais.',
    icon: <HomeIcon sx={{ fontSize: 40 }} />,
    path: '/admin/home-tutorial',
  },
];

const AdminPanel = () => {
  const navigate = useNavigate();

  const handleCardClick = (path) => {
    navigate(path);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', textAlign: 'left' }}>
        Painel Administrativo
      </Typography>
      <Grid container spacing={4} justifyContent="center">
        {adminModules.map((module) => (
          <Grid item xs={12} sm={8} md={6} lg={4} key={module.title}>
            <Card sx={{
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.05)',
              },
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <CardActionArea onClick={() => navigate(module.path)} sx={{ p: 4, flexGrow: 1 }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ color: 'primary.main', mb: 3 }}>
                    {React.cloneElement(module.icon, { sx: { fontSize: 50 } })}
                  </Box>
                  <Typography gutterBottom variant="h5" component="div" sx={{ fontWeight: 'medium' }}>
                    {module.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {module.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default AdminPanel;