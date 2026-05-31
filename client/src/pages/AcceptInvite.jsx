import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  CircularProgress
} from '@mui/material';

function AcceptInvite() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    // Espera a sessão do Supabase ser validada (o token de convite cria uma sessão)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        enqueueSnackbar('Link de convite inválido ou expirado. Peça um novo convite.', { variant: 'error' });
        navigate('/login');
      }
      setSessionLoading(false);
    }).catch(() => {
      setSessionLoading(false);
      enqueueSnackbar('Erro ao verificar o convite.', { variant: 'error' });
      navigate('/login');
    });
  }, [navigate, enqueueSnackbar]);

  const handleAcceptInvite = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
        enqueueSnackbar('A senha deve ter no mínimo 6 caracteres', { variant: 'error' });
        return;
    }

    setLoading(true);
    // O usuário já está "logado" pela sessão do token, agora só precisa definir a senha
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      enqueueSnackbar(`Erro ao definir a senha: ${error.message}`, { variant: 'error' });
    } else {
      enqueueSnackbar('Conta ativada com sucesso! Bem-vindo(a)!', { variant: 'success' });
      // Redireciona para o dashboard após definir a senha
      navigate('/dashboard');
    }
  };

  if (sessionLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Verificando convite...</Typography>
      </Box>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          Complete seu Cadastro
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1, mb: 3 }}>
          Você foi convidado para se juntar à plataforma. Por favor, defina uma senha para ativar sua conta.
        </Typography>
        <Box component="form" onSubmit={handleAcceptInvite} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Crie sua Senha"
            type="password"
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar e Entrar'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default AcceptInvite;