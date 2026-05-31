import React, { useState, useEffect } from 'react';
import { Box, Button, Container, Typography, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useSnackbar } from 'notistack';
import { useAuth } from '../contexts/AuthContext';
import ClientRegistrationForm from '../components/ClientRegistrationForm';
import AlertDialog from '../components/AlertDialog';
import LogoAvatar from '../components/LogoAvatar';

const CadastroPF = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [alertInfo, setAlertInfo] = useState({ open: false, title: '', message: '' });
  const [client, setClient] = useState({
    id: null,
    cpf: '',
    fullName: '',
    email: '',
    companyName: '',
    cep: '',
    logradouro: '',
    numero: '',
    bairro: '',
    municipio: '',
    uf: '',
    logo_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchClientData = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('empresas')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          if (data.cpf) {
            setIsEditing(true);
          }
          setClient(prevClient => ({
            ...prevClient,
            id: data.id,
            cpf: data.cpf || '',
            fullName: data.nome_completo || '',
            email: data.email || '',
            companyName: data.nome_fantasia || '',
            cep: data.cep || '',
            logradouro: data.logradouro || '',
            numero: data.numero || '',
            bairro: data.bairro || '',
            municipio: data.municipio || '',
            uf: data.uf || '',
            logo_url: data.logo_url || '',
          }));
        }
      }
    };
    fetchClientData();
  }, [user]);

  const handleLogoUpload = async (newUrl) => {
    if (!client.id) {
        enqueueSnackbar('É necessário salvar o cadastro antes de enviar um logo.', { variant: 'warning' });
        return;
    }
    setClient(prev => ({ ...prev, logo_url: newUrl }));
    const { error } = await supabase
      .from('empresas')
      .update({ logo_url: newUrl })
      .eq('id', client.id);

    if (error) {
      enqueueSnackbar(`Erro ao salvar o logo: ${error.message}`, { variant: 'error' });
    } else {
      enqueueSnackbar('Logo atualizado com sucesso!', { variant: 'success' });
    }
  };

  const handleCepSearch = async () => {
    const cepLimpo = client.cep.replace(/[\d]/g, '');
    if (cepLimpo.length !== 8) {
      enqueueSnackbar('CEP inválido. Verifique o número digitado.', { variant: 'warning' });
      return;
    }

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cepLimpo}`);
      const data = await response.json();

      if (response.ok) {
        setClient(prevState => ({
          ...prevState,
          logradouro: data.street || '',
          bairro: data.neighborhood || '',
          municipio: data.city || '',
          uf: data.state || '',
        }));
        enqueueSnackbar('Endereço carregado com sucesso!', { variant: 'success' });
      } else {
        enqueueSnackbar(data.message || 'Erro ao buscar CEP.', { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar('Não foi possível conectar à API para buscar o CEP.', { variant: 'error' });
    }
  };

  const handleSaveClient = async () => {
    if (!user) {
      setAlertInfo({ open: true, title: 'Erro de Autenticação', message: 'Você precisa estar logado para salvar.' });
      return;
    }

    const cpfLimpo = client.cpf ? client.cpf.replace(/[\d]/g, '') : '';

    if (!isEditing && (!cpfLimpo || !client.fullName)) {
      setAlertInfo({ open: true, title: 'Campos Obrigatórios', message: 'CPF e Nome Completo são obrigatórios.' });
      return;
    }
    if (isEditing && !client.fullName) {
        setAlertInfo({ open: true, title: 'Campo Obrigatório', message: 'Nome Completo é obrigatório.' });
        return;
    }
    setSaving(true);

    const dataToSave = {
        tipo_pessoa: 'FISICA',
        nome_completo: client.fullName,
        email: client.email,
        nome_fantasia: client.companyName,
        cep: client.cep,
        logradouro: client.logradouro,
        numero: client.numero,
        bairro: client.bairro,
        municipio: client.municipio,
        uf: client.uf,
    };

    if (!isEditing) {
        dataToSave.cpf = cpfLimpo;
    }

    try {
        if (isEditing) {
            const { error } = await supabase.from('empresas').update(dataToSave).eq('id', client.id);
            if (error) throw error;
            enqueueSnackbar('Cadastro atualizado com sucesso!', { variant: 'success' });
            navigate('/dashboard');
        } else {
            const { data, error } = await supabase.from('empresas').insert({ ...dataToSave, user_id: user.id }).select('id').single();
            if (error) throw error;
            setClient(prev => ({ ...prev, id: data.id }));
            setIsEditing(true);
            enqueueSnackbar('Cadastro realizado com sucesso! Agora você pode adicionar um logo.', { variant: 'success' });
        }
    } catch (error) {
        console.error('Supabase save/update error:', error);
        setAlertInfo({ open: true, title: 'Erro ao Salvar', message: 'Ocorreu um erro inesperado. Por favor, tente novamente ou contate o suporte.' });
    } finally {
        setSaving(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <Container component="main" maxWidth="md">
      <Paper sx={{ my: { xs: 2, sm: 4 }, p: { xs: 2, sm: 4 } }}>
        <Typography component="h1" variant="h5" align="center" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Cadastro de Pessoa Física
        </Typography>
        {isEditing && client.id && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <LogoAvatar
              companyId={client.id}
              url={client.logo_url}
              onUpload={handleLogoUpload}
            />
          </Box>
        )}
        <ClientRegistrationForm
          client={client}
          setClient={setClient}
          onSave={handleSaveClient}
          onSkip={handleSkip}
          saving={saving}
          handleCepSearch={handleCepSearch}
          isEditing={isEditing}
          showSkipButton={!isEditing}
        />
      </Paper>
      <AlertDialog
        open={alertInfo.open}
        onClose={() => setAlertInfo({ open: false, title: '', message: '' })}
        title={alertInfo.title}
        message={alertInfo.message}
      />
    </Container>
  );
};

export default CadastroPF;