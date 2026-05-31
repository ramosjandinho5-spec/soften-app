import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  InputAdornment,
  IconButton,
  Modal,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BlockIcon from '@mui/icons-material/Block';
import { useSnackbar } from 'notistack';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const SwitchCompany = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user, switchCompany } = useAuth(); // Pega a nova função do contexto

  useEffect(() => {
    const fetchCompanies = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_user_companies');

        if (error) {
          console.warn('Função RPC "get_user_companies" não encontrada, tentando fallback.');
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('empresas')
            .select('id, nome_fantasia, razao_social, cnpj, cpf, tipo_pessoa, is_active')
            .eq('user_id', user.id);
          
          if (fallbackError) throw fallbackError;
          setCompanies(fallbackData || []);
        } else {
          // Se a RPC não retornar 'is_active', precisamos buscar separadamente ou ajustar a RPC
          setCompanies(data || []);
        }
      } catch (error) {
        enqueueSnackbar(`Erro ao buscar empresas: ${error.message}`, { variant: 'error' });
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [user, enqueueSnackbar]);

  const handleAccessCompany = async (company) => {
    // Verifica o status da empresa antes de tentar acessá-la
    if (!company.is_active) {
      setIsBlockedModalOpen(true);
      return; // Interrompe a execução
    }

    console.log(`[SwitchCompany] Botão 'Acessar' clicado para empresa: ${company.nome_fantasia} (ID: ${company.id})`);
    try {
      console.log(`[SwitchCompany] Chamando a função 'switchCompany' do contexto...`);
      await switchCompany(company.id);
      console.log(`[SwitchCompany] 'switchCompany' finalizada com sucesso. Navegando para /dashboard...`);
      enqueueSnackbar('Empresa alterada com sucesso!', { variant: 'success' });
      navigate('/dashboard');
    } catch (error) {
      console.error(`[SwitchCompany] Erro ao tentar alterar para a empresa ID ${company.id}:`, error);
      enqueueSnackbar(`Erro ao alterar empresa: ${error.message}`, { variant: 'error' });
    }
  };

  const handleCloseModal = () => {
    setIsBlockedModalOpen(false);
  };

  const filteredCompanies = companies.filter(company =>
    (company.nome_fantasia?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (company.razao_social?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (company.cnpj?.toString() || '').includes(searchTerm)
  );

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 } }}>
      <Paper 
        elevation={3}
        sx={{
          p: { xs: 2, sm: 4 },
          borderRadius: '12px',
          width: '100%',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              color: '#1976D2', 
              fontWeight: 'bold',
              fontSize: { xs: '1.75rem', sm: '2.5rem' } // Ajuste de fonte responsivo
            }}
          >
            Selecione a empresa
          </Typography>
          <Typography 
            variant="subtitle1" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }} // Ajuste de fonte responsivo
          >
            Escolha uma empresa para acessar
          </Typography>
        </Box>

        <TextField
          fullWidth
          variant="outlined"
          placeholder="Pesquisar empresa"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        <Button
          fullWidth
          variant="outlined"
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => navigate('/cadastrar-empresa')}
          sx={{ mb: 3, justifyContent: 'flex-start', textTransform: 'none', fontSize: '1rem', p: 1.5 }}
        >
          Nova Empresa
        </Button>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {filteredCompanies.map((company, index) => (
              <React.Fragment key={company.id}>
                <ListItem 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' }, // Empilha em telas pequenas
                    alignItems: { xs: 'stretch', sm: 'center' }, // Alinha itens
                    py: 2 
                  }}
                >
                  <Box sx={{ flexGrow: 1, mb: { xs: 2, sm: 0 }, mr: { sm: 2 }, minWidth: 0 }}>
                    <ListItemText
                      primaryTypographyProps={{ style: { textDecoration: company.is_active ? 'none' : 'line-through' } }}
                      secondaryTypographyProps={{ style: { textDecoration: company.is_active ? 'none' : 'line-through' } }}
                      primary={(company.tipo_pessoa === 'FISICA' ? company.nome_fantasia || company.nome_completo : company.nome_fantasia || company.razao_social) || 'Nome não informado'}
                      secondary={company.tipo_pessoa === 'FISICA' ? (company.cpf ? `CPF: ${company.cpf}` : '') : (company.cnpj ? `CNPJ: ${company.cnpj}` : '')}
                      sx={{ m: 0 }}
                    />
                  </Box>
                  <Button 
                    variant="contained" 
                    endIcon={<ArrowForwardIcon />} 
                    onClick={() => handleAccessCompany(company)}
                    sx={{ width: { xs: '100%', sm: 'auto' }, ml: { sm: 2 }, flexShrink: 0 }}
                  >
                    Acessar
                  </Button>
                </ListItem>
                {index < filteredCompanies.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
        
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button variant="outlined" onClick={() => navigate('/dashboard')}>
            Voltar para o Dashboard
          </Button>
        </Box>
      </Paper>

      <Modal
        open={isBlockedModalOpen}
        onClose={handleCloseModal}
        aria-labelledby="company-blocked-title"
        aria-describedby="company-blocked-description"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ 
          width: 400, 
          bgcolor: 'background.paper', 
          boxShadow: 24, 
          p: 4, 
          borderRadius: 2,
          textAlign: 'center'
        }}>
          <BlockIcon sx={{ fontSize: 60, color: 'error.main' }} />
          <Typography id="company-blocked-title" variant="h5" component="h2" sx={{ mt: 2 }}>
            Acesso Bloqueado
          </Typography>
          <Typography id="company-blocked-description" sx={{ mt: 2 }}>
            Esta empresa está com o acesso temporariamente bloqueado. Para regularizar a situação, por favor, entre em contato com o nosso suporte.
          </Typography>
          <Button variant="contained" onClick={handleCloseModal} sx={{ mt: 3 }}>
            Fechar
          </Button>
        </Box>
      </Modal>
    </Container>
  );
};

export default SwitchCompany;