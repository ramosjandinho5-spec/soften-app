import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  Grid,
  Link,
  TextField,
  Typography,
  CircularProgress,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import logo from '../assets/images/logo.png.png.png';

const Login = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isResetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const { enqueueSnackbar } = useSnackbar();

  const testimonials = [
    {
      quote: "Gestão que impulsiona resultados.",
      description: "Um ERP completo para simplificar processos, tomar decisões e fazer sua empresa crescer."
    },
    {
      quote: "Automação e Eficiência.",
      description: "Reduza tarefas manuais e otimize seu tempo com nossas ferramentas de automação."
    },
    {
      quote: "Visão 360° do seu Negócio.",
      description: "Tenha acesso a relatórios detalhados e dashboards intuitivos para uma gestão mais inteligente."
    }
  ];

  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000); // Muda a cada 5 segundos

    return () => clearInterval(timer);
  }, [testimonials.length]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSignUp) {
      handleSignUp();
    } else {
      handleLogin();
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }
    if (!fullName) {
      setError('Por favor, insira seu nome completo.');
      return;
    }
    setLoading(true);
    setError('');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) {
      setError(error.message);
    } else if (data.user) {
      if (data.user.identities && data.user.identities.length === 0) {
         setError('Usuário precisa confirmar o e-mail, mas a funcionalidade não está ativa. Habilite no Supabase.');
      } else {
         navigate('/welcome');
      }
    }
    setLoading(false);
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      enqueueSnackbar('Por favor, insira seu e-mail.', { variant: 'warning' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: 'https://coresyncjr.netlify.app/update-password',
    });
    setLoading(false);
    setResetModalOpen(false);
    if (error) {
      enqueueSnackbar(`Erro: ${error.message}`, { variant: 'error' });
    } else {
      enqueueSnackbar('Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.', { variant: 'info' });
    }
    setResetEmail('');
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const toggleFormMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setFullName('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <Grid container component="main" sx={{ height: '100vh', backgroundColor: '#f4f6f8', justifyContent: 'center', alignItems: 'center' }}>
      {/* Coluna da Esquerda (Branding) */}
      <Grid
        item
        xs={false}
        sm={false}
        md={7}
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          p: 4,
        }}
      >
        <Box sx={{ 
          position: 'absolute', 
          top: -5, 
          left: 20,
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'scale(1.05)'
          }
        }}>
          <img src={logo} alt="Logo" style={{ height: '140px', display: 'block' }} />
        </Box>
        <Box sx={{ width: '100%', maxWidth: 450, position: 'relative', height: 220, mt: -10, ml: 30 }}>
          {testimonials.map((testimonial, index) => (
            <Box
              key={index}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                opacity: index === currentTestimonial ? 1 : 0,
                transition: 'opacity 0.5s ease-in-out',
              }}
            >
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: '#10466b' }}>
                {testimonial.quote}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                {testimonial.description}
              </Typography>
            </Box>
          ))}
        </Box>
      </Grid>

      {/* Coluna da Direita (Formulário) */}
      <Grid item component={Paper} elevation={6} sx={{ width: '100%', maxWidth: '400px' }}>
        <Box
          sx={{
            my: 4,
            mx: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography component="h1" variant="h5" sx={{ mb: 1, fontWeight: 'bold', color: '#10466b' }}>
            {isSignUp ? 'Crie sua conta' : 'Bem-vindo!'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {isSignUp ? 'Preencha os campos para se cadastrar' : 'Faça login para acessar o sistema'}
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
            {isSignUp && (
              <TextField
                margin="normal"
                required
                fullWidth
                id="fullName"
                label="Nome Completo"
                name="fullName"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            )}
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="E-mail"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Senha"
              type="password"
              id="password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            {isSignUp && (
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirmar Senha"
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            )}
            {error && (
              <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}
            {!isSignUp && (
              <Grid container alignItems="center" justifyContent="space-between">
                <Grid item>
                  <FormControlLabel
                    control={<Checkbox value="remember" color="primary" />}
                    label="Lembrar de mim"
                  />
                </Grid>
                <Grid item>
                  <Link href="#" variant="body2" onClick={() => setResetModalOpen(true)}>
                    Esqueci minha senha
                  </Link>
                </Grid>
              </Grid>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : (isSignUp ? 'Cadastrar' : 'Entrar')}
            </Button>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
              {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}{' '}
              <Link component="button" type="button" onClick={toggleFormMode} variant="body2">
                {isSignUp ? 'Fazer login' : 'Criar conta'}
              </Link>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ my: 2, textAlign: 'center' }}>
              ou continue com
            </Typography>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              sx={{ py: 1.5 }}
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              Entrar com Google
            </Button>
          </Box>
        </Box>
      </Grid>

      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          position: 'absolute',
          bottom: 0,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {'© '}
          2026
          {' OrganizaÊ - JR Web Solutions. Todos os direitos reservados.'}
        </Typography>
      </Box>

      <Dialog open={isResetModalOpen} onClose={() => setResetModalOpen(false)}>
        <DialogTitle>Redefinir Senha</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Por favor, insira seu endereço de e-mail. Enviaremos um link para você redefinir sua senha.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="reset-email"
            label="Endereço de E-mail"
            type="email"
            fullWidth
            variant="standard"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetModalOpen(false)}>Cancelar</Button>
          <Button onClick={handlePasswordReset} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Enviar Link'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default Login;