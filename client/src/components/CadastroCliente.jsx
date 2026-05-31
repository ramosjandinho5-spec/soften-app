import { useState, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Grid,
  Paper,
  IconButton,
  InputAdornment,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

function CadastroCliente({ onCadastroSucesso, onCancel, clienteParaEditar }) {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth(); // Pega o usuário do contexto
  const [formState, setFormState] = useState({
    nome: '',
    nome_fantasia: '',
    cnpj_cpf: '',
    ie_rg: '',
    data_nascimento: '',
    tipo_contribuinte: 'Não Contribuinte',
    regime_tributario: 'Simples Nacional',
    data_cadastro: new Date().toISOString().split('T')[0],
    contato_nome: '',
    celular: '',
    email: '',
    telefone: '',
    cep: '',
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
  });
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [cepSearchLoading, setCepSearchLoading] = useState(false); // Estado para o loading do CEP
  const isEditMode = Boolean(clienteParaEditar);

  useEffect(() => {
    if (isEditMode) {
      setFormState(clienteParaEditar);
    }
  }, [clienteParaEditar, isEditMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState(prevState => ({ ...prevState, [name]: value }));
  };

  const handleBuscaCnpj = async () => {
    const cnpj = formState.cnpj_cpf.replace(/\D/g, '');
    if (cnpj.length !== 14) {
      alert('Por favor, insira um CNPJ válido com 14 dígitos.');
      return;
    }

    try {
      setSearchLoading(true);
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      if (!response.ok) {
        throw new Error('CNPJ não encontrado ou API indisponível.');
      }
      const data = await response.json();

      setFormState(prevState => ({
        ...prevState,
        nome: data.razao_social || '',
        nome_fantasia: data.nome_fantasia || '',
        cep: data.cep || '',
        rua: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.municipio || '',
        estado: data.uf || '',
        numero: data.numero || '',
        email: data.email || prevState.email,
        telefone: data.ddd_telefone_1 || prevState.telefone,
      }));

    } catch (error) {
      alert('Erro ao buscar CNPJ: ' + error.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleBuscaCep = async () => {
    const cep = formState.cep.replace(/\D/g, '');
    if (cep.length !== 8) {
      enqueueSnackbar('Por favor, insira um CEP válido com 8 dígitos.', { variant: 'warning' });
      return;
    }

    try {
      setCepSearchLoading(true);
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!response.ok) {
        throw new Error('CEP não encontrado ou API indisponível.');
      }
      const data = await response.json();

      if (data.erro) {
        throw new Error('CEP não encontrado.');
      }

      setFormState(prevState => ({
        ...prevState,
        rua: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        estado: data.uf || '',
      }));
      enqueueSnackbar('Endereço encontrado!', { variant: 'success' });

    } catch (error) {
      enqueueSnackbar('Erro ao buscar CEP: ' + error.message, { variant: 'error' });
    } finally {
      setCepSearchLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Obter o company_id ativo do perfil do usuário.
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profileData?.company_id) {
        throw new Error("Nenhuma empresa ativa encontrada. Selecione uma empresa primeiro.");
      }

      const companyId = profileData.company_id;

      let error;
      if (isEditMode) {
        // Lógica de atualização - não precisa do company_id pois a RLS já garante o escopo
        const { error: updateError } = await supabase
          .from('clientes')
          .update(formState)
          .eq('id', clienteParaEditar.id);
        error = updateError;
      } else {
        // Lógica de inserção - Adiciona o company_id ao novo cliente
        const { error: insertError } = await supabase
          .from('clientes')
          .insert([{ ...formState, company_id: companyId }]);
        error = insertError;
      }

      if (error) throw error;

      enqueueSnackbar(
        isEditMode ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!',
        { variant: 'success' }
      );
      if (onCadastroSucesso) onCadastroSucesso();

    } catch (error) {
      enqueueSnackbar('Erro: ' + error.message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 4, width: '100%' }}>
      <Typography variant="h4" component="h2" sx={{ mb: 4 }}>
        {isEditMode ? 'Editar Cliente' : 'Cadastro de Cliente'}
      </Typography>
      <Box component="form" onSubmit={handleSubmit}>
        
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Dados Principais
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <TextField
                label="CNPJ/CPF"
                name="cnpj_cpf"
                value={formState.cnpj_cpf}
                onChange={handleInputChange}
                fullWidth
              />
              <Box sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>
                <IconButton onClick={handleBuscaCnpj} disabled={searchLoading}>
                  {searchLoading ? <CircularProgress size={24} /> : <SearchIcon />}
                </IconButton>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={8}>
            <TextField
              label="Nome / Razão Social"
              name="nome"
              value={formState.nome}
              onChange={handleInputChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={8}>
            <TextField
              label="Nome Fantasia"
              name="nome_fantasia"
              value={formState.nome_fantasia}
              onChange={handleInputChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="IE / RG"
              name="ie_rg"
              value={formState.ie_rg}
              onChange={handleInputChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Data de Nascimento"
              name="data_nascimento"
              type="date"
              value={formState.data_nascimento || ''}
              onChange={handleInputChange}
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Contribuinte</InputLabel>
              <Select
                name="tipo_contribuinte"
                value={formState.tipo_contribuinte}
                label="Tipo de Contribuinte"
                onChange={handleInputChange}
              >
                <MenuItem value="Contribuinte ICMS">Contribuinte ICMS</MenuItem>
                <MenuItem value="Contribuinte Isento">Contribuinte Isento</MenuItem>
                <MenuItem value="Não Contribuinte">Não Contribuinte</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Regime Tributário</InputLabel>
              <Select
                name="regime_tributario"
                value={formState.regime_tributario}
                label="Regime Tributário"
                onChange={handleInputChange}
              >
                <MenuItem value="Simples Nacional">Simples Nacional</MenuItem>
                <MenuItem value="Lucro Presumido">Lucro Presumido</MenuItem>
                <MenuItem value="Lucro Real">Lucro Real</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Data do Cadastro"
              name="data_cadastro"
              type="date"
              value={formState.data_cadastro}
              onChange={handleInputChange}
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
        </Grid>

        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
          Endereço
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              label="CEP"
              name="cep"
              value={formState.cep}
              onChange={handleInputChange}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleBuscaCep} disabled={cepSearchLoading}>
                      {cepSearchLoading ? <CircularProgress size={24} /> : <SearchIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={8}>
            <TextField
              label="Rua"
              name="rua"
              value={formState.rua}
              onChange={handleInputChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              label="Número"
              name="numero"
              value={formState.numero}
              onChange={handleInputChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={5}>
            <TextField
              label="Bairro"
              name="bairro"
              value={formState.bairro}
              onChange={handleInputChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="Cidade"
              name="cidade"
              value={formState.cidade}
              onChange={handleInputChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              label="Estado"
              name="estado"
              value={formState.estado}
              onChange={handleInputChange}
              fullWidth
            />
          </Grid>
        </Grid>

        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
          Contato
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Nome do Contato"
              name="contato_nome"
              value={formState.contato_nome}
              onChange={handleInputChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Celular"
              name="celular"
              value={formState.celular}
              onChange={handleInputChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Email"
              name="email"
              type="email"
              value={formState.email}
              onChange={handleInputChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Telefone"
              name="telefone"
              value={formState.telefone}
              onChange={handleInputChange}
              fullWidth
            />
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
          <Button variant="outlined" onClick={() => navigate('/dashboard')} disabled={loading}>
            Pular
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ position: 'relative' }}
          >
            {loading && <CircularProgress size={24} sx={{ position: 'absolute' }} />}
            {loading ? '' : (isEditMode ? 'Atualizar' : 'Salvar')}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}

export default CadastroCliente;