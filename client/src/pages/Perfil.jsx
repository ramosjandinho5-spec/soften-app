import React, { useState, useEffect } from 'react';
import { Typography, Paper, Box, TextField, Button, Grid, Divider, Avatar, IconButton, InputAdornment } from '@mui/material';
import { PhotoCamera, Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import { useSnackbar } from 'notistack';

function Perfil() {
  const { user, refreshUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || '');
      setEmail(user.email || '');
      setAvatarUrl(user.user_metadata?.avatar_url);
    }
  }, [user]);

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  async function handleAvatarUpload(event) {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você precisa selecionar uma imagem para carregar.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `${fileName}`;

      let { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Pega a URL pública base do arquivo
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      // Adiciona um carimbo de data/hora para forçar o navegador a recarregar a imagem
      const urlWithCacheBuster = `${publicUrl}?t=${new Date().getTime()}`;

      const { error: updateUserError } = await supabase.auth.updateUser({
        data: { avatar_url: urlWithCacheBuster } // Salva a URL com o cache buster
      });

      if (updateUserError) throw updateUserError;
      
      await refreshUser(); // Força a atualização do usuário no contexto
      enqueueSnackbar('Avatar atualizado!', { variant: 'success' });

    } catch (error) {
      enqueueSnackbar('Erro ao carregar o avatar: ' + error.message, { variant: 'error' });
    } finally {
      setUploading(false);
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    // --- Lógica de Alteração de Senha ---
    if (password) {
      if (password !== confirmPassword) {
        enqueueSnackbar('As novas senhas não coincidem!', { variant: 'error' });
        setLoading(false);
        return;
      }
      if (!currentPassword) {
        enqueueSnackbar('Você precisa informar sua senha atual para alterá-la.', { variant: 'error' });
        setLoading(false);
        return;
      }

      // Verifica a senha atual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        enqueueSnackbar('A senha atual está incorreta.', { variant: 'error' });
        setLoading(false);
        return;
      }

      // Atualiza para a nova senha
      const { error: passwordError } = await supabase.auth.updateUser({ password: password });
      if (passwordError) {
        enqueueSnackbar('Erro ao atualizar a senha: ' + passwordError.message, { variant: 'error' });
        setLoading(false);
        return;
      }
    }

    // --- Lógica de Atualização de Dados do Perfil ---
    if (fullName !== user.user_metadata?.full_name) {
      // Atualiza os metadados de autenticação
      const { error: metaError } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });

      if (metaError) {
        enqueueSnackbar('Erro ao atualizar o nome (auth): ' + metaError.message, { variant: 'error' });
        setLoading(false);
        return;
      }

      // Atualiza a tabela 'profiles'
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (profileError) {
        enqueueSnackbar('Erro ao atualizar o nome (profile): ' + profileError.message, { variant: 'error' });
        setLoading(false);
        return;
      }

      await refreshUser(); // Força a atualização do usuário no contexto
    }

    enqueueSnackbar('Perfil atualizado com sucesso!', { variant: 'success' });
    setCurrentPassword('');
    setPassword('');
    setConfirmPassword('');
    setLoading(false);
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 800, margin: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Meu Perfil
      </Typography>
      <form onSubmit={handleUpdateProfile}>
        <Grid container spacing={3}>
          <Grid item xs={12} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar src={avatarUrl} sx={{ width: 120, height: 120, mb: 2 }}>
              {fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </Avatar>
            <Button
              variant="contained"
              component="label"
              startIcon={<PhotoCamera />}
              disabled={uploading}
            >
              {uploading ? 'Enviando...' : 'Alterar Foto'}
              <input type="file" hidden accept="image/*" onChange={handleAvatarUpload} />
            </Button>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nome Completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Email"
              value={email}
              disabled
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6">Alterar Senha</Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Senha Atual"
              type={showPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Nova Senha"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              variant="outlined"
              helperText="Deixe em branco para não alterar"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Confirmar Senha"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12}>
            <Button type="submit" variant="contained" color="primary" disabled={loading || uploading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
}

export default Perfil;