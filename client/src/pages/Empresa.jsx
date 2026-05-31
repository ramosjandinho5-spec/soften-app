import React, { useState, useEffect } from 'react';
import { Paper, Typography, CircularProgress } from '@mui/material';
import { useSnackbar } from 'notistack';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import EmpresaForm from '../components/EmpresaForm';
import ClientForm from '../components/ClientForm';
import LogoAvatar from '../components/LogoAvatar';

function Empresa() {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
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
    logo_url: null,
    tipo_pessoa: 'JURIDICA', // Default
    cpf: '',
    nome_completo: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cnpjExists, setCnpjExists] = useState(false);

  useEffect(() => {
    const fetchEmpresa = async () => {
      if (!user) return;
      setLoading(true);

      try {
        // Busca a empresa mais recente associada ao user_id
        const { data: companyData, error: companyError } = await supabase
          .from('empresas')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }) // Pega a mais recente
          .limit(1)
          .maybeSingle();

        if (companyError) {
          throw companyError;
        }

        if (companyData) {
          setEmpresa(companyData);
          if (companyData.cnpj) {
            setCnpjExists(true);
          }
        }
      } catch (error) {
        enqueueSnackbar(`Erro ao carregar dados da empresa: ${error.message}`, { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchEmpresa();
  }, [user, enqueueSnackbar]);

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

  const handleLogoUpload = async (newUrl) => {
    setEmpresa(prev => ({ ...prev, logo_url: newUrl }));
    const { error } = await supabase
      .from('empresas')
      .update({ logo_url: newUrl })
      .eq('id', empresa.id);

    if (error) {
      enqueueSnackbar(`Erro ao salvar o logo: ${error.message}`, { variant: 'error' });
    }
  };

  const handleSave = async () => {
    if (!user) {
      enqueueSnackbar('Você precisa estar logado para salvar.', { variant: 'error' });
      return;
    }
    setSaving(true);

    const { data, error } = await supabase
      .from('empresas')
      .upsert({ ...empresa, user_id: user.id })
      .select()
      .single();

    if (error) {
      enqueueSnackbar(`Erro ao salvar: ${error.message}`, { variant: 'error' });
    } else {
      setEmpresa(data);
      if (data.cnpj) {
        setCnpjExists(true);
      }
      enqueueSnackbar('Informações da empresa salvas com sucesso!', { variant: 'success' });
    }
    setSaving(false);
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Paper sx={{ p: 4, maxWidth: '800px', margin: 'auto' }}>
      <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>
        Cadastro da Empresa
      </Typography>
      
      <LogoAvatar 
        userId={user.id}
        companyId={empresa.id}
        url={empresa.logo_url}
        onUpload={handleLogoUpload}
      />

      {/* Se for FISICA ou se tiver CPF (para compatibilidade com registros antigos) */}
      {(empresa.tipo_pessoa === 'FISICA' || empresa.cpf) ? (
        <ClientForm
          empresa={empresa}
          setEmpresa={setEmpresa}
          handleSave={handleSave}
          saving={saving}
        />
      ) : (
        <EmpresaForm
          empresa={empresa}
          setEmpresa={setEmpresa}
          handleCnpjSearch={handleCnpjSearch}
          handleSave={handleSave}
          saving={saving}
          cnpjDisabled={cnpjExists}
        />
      )}
    </Paper>
  );
}

export default Empresa;