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

function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true); // Loading para a sessão
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    // Espera a sessão do Supabase ser validada
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // Se não houver sessão após a verificação, o token é inválido ou expirou.
        enqueueSnackbar('Link de recuperação inválido ou expirado. Por favor, tente novamente.', { variant: 'error' });
        navigate('/login');
      }
      setSessionLoading(false);
    }).catch(() => {
      setSessionLoading(false);
      enqueueSnackbar('Erro ao verificar sessão.', { variant: 'error' });
      navigate('/login');
    });
  }, [navigate, enqueueSnackbar]);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      enqueueSnackbar('As senhas não correspondem', { variant: 'error' });
      return;
    }
    if (password.length < 6) {
        enqueueSnackbar('A senha deve ter no mínimo 6 caracteres', { variant: 'error' });
        return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      enqueueSnackbar(`Erro ao atualizar a senha: ${error.message}`, { variant: 'error' });
    } else {
      enqueueSnackbar('Senha atualizada com sucesso! Você será redirecionado para o login.', { variant: 'success' });
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  };

  if (sessionLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Verificando link...</Typography>
      </Box>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          Crie sua nova senha
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1, mb: 3 }}>
          Por favor, defina uma nova senha para sua conta.
        </Typography>
        <Box component="form" onSubmit={handlePasswordReset} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Nova Senha"
            type="password"
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirmar Nova Senha"
            type="password"
            id="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar Senha'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default UpdatePassword;