import React from 'react';
import {
  Box,
  Button,
  Grid,
  Link,
  TextField,
  Typography,
  Paper
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Register = () => {
  return (
    <Grid container component="main" sx={{ height: '100vh' }}>
      {/* Coluna da Esquerda (Branding) */}
      <Grid
        item
        xs={false}
        sm={6}
        md={6}
        sx={{
          backgroundColor: '#f4f6f8',
          display: { xs: 'none', sm: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-end',
          p: 4,
        }}
      >
        <Box sx={{ maxWidth: 400 }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
            Gestão que <br /> impulsiona <br />{' '}
            <span style={{ color: '#1976d2' }}>resultados.</span>
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Um ERP completo para simplificar processos, tomar decisões e fazer sua empresa crescer.
          </Typography>
        </Box>
      </Grid>

      {/* Coluna da Direita (Formulário) */}
      <Grid
        item
        xs={12}
        sm={6}
        md={6}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          paddingLeft: '40%',
          pr: 4,
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            maxWidth: 400,
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h5" sx={{ mb: 1, fontWeight: 'bold' }}>
            Crie sua conta
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Preencha os dados para se registrar
          </Typography>
          <Box component="form" noValidate sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Nome completo"
              name="name"
              autoComplete="name"
              autoFocus
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="E-mail"
              name="email"
              autoComplete="email"
            />
            <TextField
                      margin="normal"
                      required
                      fullWidth
                      name="password"
                      label="Senha"
                      type="password"
                      id="password"
                    />
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      name="confirmPassword"
                      label="Confirmar senha"
                      type="password"
                      id="confirmPassword"
                    />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              Criar conta
            </Button>
            <Grid container justifyContent="center" sx={{ mt: 2 }}>
              <Grid item>
                <Typography variant="body2" color="text.secondary">
                  Já tem uma conta?{' '}
                  <Link component={RouterLink} to="/login" variant="body2">
                    Entrar
                  </Link>
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Register;