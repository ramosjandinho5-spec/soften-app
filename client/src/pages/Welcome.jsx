import React, { useState } from 'react';
import { Box, Button, Container, Typography, Paper, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useSnackbar } from 'notistack';
import { useAuth } from '../contexts/AuthContext';
import EmpresaModal from '../components/EmpresaModal';
import EmpresaForm from '../components/EmpresaForm';
import ClientModal from '../components/ClientModal';
import ClientRegistrationForm from '../components/ClientRegistrationForm';
import AlertDialog from '../components/AlertDialog';

const Welcome = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ open: false, title: '', message: '' });
  const [client, setClient] = useState({
    cpf: '',
    fullName: '',
    email: '',
    companyName: '',
  });
  const [empresa, setEmpresa] = useState({
    id: null,
    cnpj: '',
    razao_social: '',
    nome_fantasia: '',
    inscricao_estadual: '',
    logradouro: '',
    bairro: '',
    municipio: '',
    uf: '',
    email: '',
    telefone: '',
  });
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const handleOpenModal = () => {
    localStorage.setItem('registration_preference', 'PJ');
    setIsModalOpen(true);
  };

  const handleCloseModal = (event, reason) => {
    if (reason && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
      return; // Impede o fechamento
    }
    setIsModalOpen(false);
  };

  const handleSaveClient = async () => {
    if (!user) {
      setAlertInfo({ open: true, title: 'Erro de Autenticação', message: 'Você precisa estar logado para salvar.' });
      return;
    }

    const cpfLimpo = client.cpf ? client.cpf.replace(/[^\d]/g, '') : '';

    if (!cpfLimpo || !client.fullName) {
      setAlertInfo({ open: true, title: 'Campos Obrigatórios', message: 'CPF e Nome Completo são obrigatórios.' });
      return;
    }
    setSaving(true);

    // Verifica se o CPF já existe
    const { data: existingClient } = await supabase
      .from('empresas')
      .select('id')
      .eq('cpf', cpfLimpo)
      .single();

    if (existingClient) {
      setAlertInfo({
        open: true,
        title: 'CPF já cadastrado!',
        message: 'O CPF informado já está em uso. Verifique os dados, pule esta etapa ou entre em contato com o suporte.',
      });
      setSaving(false);
      return;
    }

    const { error } = await supabase.from('empresas').insert({
      user_id: user.id,
      tipo_pessoa: 'FISICA',
      cpf: cpfLimpo,
      nome_completo: client.fullName,
      email: client.email,
      nome_fantasia: client.companyName,
    });

    if (error) {
      setAlertInfo({ open: true, title: 'Erro ao Salvar', message: 'Ocorreu um erro inesperado. Por favor, tente novamente ou contate o suporte.' });
    } else {
      enqueueSnackbar('Cadastro realizado com sucesso!', { variant: 'success' });
        navigate('/dashboard');
      }
    setSaving(false);
  };

  const handleOpenClientModal = () => {
    localStorage.setItem('registration_preference', 'PF');
    setIsClientModalOpen(true);
  };

  const handleCloseClientModal = () => {
    setIsClientModalOpen(false);
  };

  const handleSkipInModal = async () => {
    if (!user) {
      setAlertInfo({ open: true, title: 'Erro de Autenticação', message: 'Você precisa estar logado para salvar.' });
      return;
    }
    setSaving(true);

    const cnpjLimpo = empresa.cnpj.replace(/[^\d]/g, '');

    if (!cnpjLimpo) {
      setAlertInfo({ open: true, title: 'Campo Obrigatório', message: 'O campo CNPJ é obrigatório para esta ação.' });
      setSaving(false);
      return;
    }

    // Verifica se o CNPJ já existe
    const { data: existingEmpresa } = await supabase
      .from('empresas')
      .select('id')
      .eq('cnpj', cnpjLimpo)
      .single();

    if (existingEmpresa) {
      setAlertInfo({
        open: true,
        title: 'Empresa já cadastrada!',
        message: 'O CNPJ informado já está em uso. Cadastre uma nova empresa, pule esta etapa ou entre em contato com o suporte.',
      });
      setSaving(false);
      return;
    }

    const { error } = await supabase.from('empresas').insert({
      user_id: user.id,
      cnpj: cnpjLimpo,
      tipo_pessoa: 'JURIDICA',
    });

    if (error) {
      setAlertInfo({ open: true, title: 'Erro ao Salvar', message: 'Ocorreu um erro inesperado. Por favor, tente novamente ou contate o suporte.' });
    } else {
      enqueueSnackbar('CNPJ salvo. Você pode completar o cadastro depois.', { variant: 'info' });
      navigate('/dashboard');
    }
    setSaving(false);
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  const handleCnpjSearch = async () => {
    const cnpjLimpo = empresa.cnpj.replace(/[^\d]/g, '');
    if (cnpjLimpo.length !== 14) {
      enqueueSnackbar('CNPJ inválido. Verifique o número digitado.', { variant: 'warning' });
      return;
    }

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      const data = await response.json();

      if (response.ok) {
        setEmpresa(prevState => ({
          ...prevState,
          razao_social: data.razao_social || '',
          nome_fantasia: data.nome_fantasia || '',
          logradouro: `${data.logradouro}, ${data.numero}`,
          bairro: data.bairro || '',
          municipio: data.municipio || '',
          uf: data.uf || '',
          email: data.email || '',
          telefone: data.ddd_telefone_1 || '',
        }));
        enqueueSnackbar('Dados da empresa carregados com sucesso!', { variant: 'success' });
      } else {
        enqueueSnackbar(data.message || 'Erro ao buscar CNPJ.', { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar('Não foi possível conectar à API para buscar o CNPJ.', { variant: 'error' });
    }
  };

  const handleSave = async () => {
    if (!user) {
      setAlertInfo({ open: true, title: 'Erro de Autenticação', message: 'Você precisa estar logado para salvar.' });
      return;
    }
    setSaving(true);

    const cnpjLimpo = empresa.cnpj.replace(/[^\d]/g, '');

    // Verifica se o CNPJ já existe
    const { data: existingEmpresa } = await supabase
      .from('empresas')
      .select('id')
      .eq('cnpj', cnpjLimpo)
      .single();

    if (existingEmpresa) {
      setAlertInfo({
        open: true,
        title: 'Empresa já cadastrada!',
        message: 'O CNPJ informado já está em uso. Cadastre uma nova empresa, pule esta etapa ou entre em contato com o suporte.',
      });
      setSaving(false);
      return;
    }

    const { id, ...empresaData } = empresa; // Remove o ID nulo antes de inserir

    const { error } = await supabase.from('empresas').insert({
      ...empresaData,
      user_id: user.id,
      tipo_pessoa: 'JURIDICA',
      cnpj: cnpjLimpo,
    });

    if (error) {
      setAlertInfo({ open: true, title: 'Erro ao Salvar', message: 'Ocorreu um erro inesperado. Por favor, tente novamente ou contate o suporte.' });
    } else {
      enqueueSnackbar('Empresa salva com sucesso!', { variant: 'success' });
        navigate('/dashboard');
      }
    setSaving(false);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f4f6f8',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            textAlign: 'center',
          }}
        >
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#10466b', fontSize: { xs: '2.2rem', sm: '3rem' } }}>
            Bem-vindo à OrganizaÊ!
          </Typography>
          <Typography variant="h6" color="text.secondary" paragraph>
            Sua conta foi criada com sucesso.
          </Typography>
          <Typography variant="body1" paragraph>
            Para uma experiência mais completa, selecione o tipo de cadastro. Este passo é opcional.
          </Typography>
          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center', flexDirection: { xs: 'column', sm: 'row' } }}>
            <Button
              variant="outlined"
              size="large"
              onClick={handleSkip}
              disabled={loading}
            >
              Pular etapa
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={handleOpenClientModal}
              disabled={loading}
            >
              Pessoa Física
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={handleOpenModal} 
              disabled={loading}
            >
              Pessoa Jurídica
            </Button>
          </Box>
        </Paper>
      </Container>
      <EmpresaModal open={isModalOpen} onClose={handleCloseModal}>
        <EmpresaForm
          empresa={empresa}
          setEmpresa={setEmpresa}
          handleCnpjSearch={handleCnpjSearch}
          handleSave={handleSave}
          saving={saving}
          onSkip={handleSkipInModal}
          showSkipButton={true}
          cnpjDisabled={false}
        />
      </EmpresaModal>
      <ClientModal open={isClientModalOpen} onClose={handleCloseClientModal}>
        <ClientRegistrationForm
          client={client}
          setClient={setClient}
          onSave={handleSaveClient}
          onSkip={handleSkip}
          saving={saving}
        />
      </ClientModal>
      <AlertDialog
        open={alertInfo.open}
        onClose={() => setAlertInfo({ open: false, title: '', message: '' })}
        title={alertInfo.title}
        message={alertInfo.message}
      />
    </Box>
  );
};

export default Welcome;