import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { supabase } from '../supabaseClient';
import { useSnackbar } from 'notistack';
import EditCompanyModal from '../components/EditCompanyModal';

function CompanyManagement() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCompany, setEditingCompany] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const fetchCompanies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('empresas')
      .select('id, nome_fantasia, razao_social, cnpj, is_active, cpf, nome_completo, tipo_pessoa, slug');

    if (error) {
      enqueueSnackbar(`Erro ao buscar empresas: ${error.message}`, { variant: 'error' });
    } else {
      setCompanies(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleEdit = (company) => {
    setEditingCompany(company);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCompany(null);
  };

  const handleSave = (updatedCompany) => {
    setCompanies(companies.map(c => c.id === updatedCompany.id ? updatedCompany : c));
    fetchCompanies(); // Re-fetch to ensure data consistency
  };

  const handleToggleActive = async (company) => {
    const newStatus = !company.is_active;
    const { error } = await supabase
      .from('empresas')
      .update({ is_active: newStatus })
      .eq('id', company.id);

    if (error) {
      enqueueSnackbar(`Erro ao ${newStatus ? 'liberar' : 'bloquear'} empresa: ${error.message}`, { variant: 'error' });
    } else {
      enqueueSnackbar(`Empresa ${newStatus ? 'liberada' : 'bloqueada'} com sucesso!`, { variant: 'success' });
      fetchCompanies();
    }
  };

  const openDeleteConfirm = (company) => {
    setCompanyToDelete(company);
    setIsConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    setCompanyToDelete(null);
    setIsConfirmOpen(false);
  };

  const handleDelete = async () => {
    if (!companyToDelete) return;

    try {
      const { error } = await supabase.functions.invoke('delete-company', {
        body: { companyId: companyToDelete.id },
      });

      if (error) {
        // O erro da Edge Function já será uma mensagem amigável
        throw new Error(error.message);
      }

      enqueueSnackbar('Empresa excluída com sucesso!', { variant: 'success' });
      setCompanies(companies.filter(c => c.id !== companyToDelete.id));

    } catch (error) {
      enqueueSnackbar(`Erro ao excluir empresa: ${error.message}`, { variant: 'error' });
    }

    closeDeleteConfirm();
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Gerenciamento de Empresas
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Aqui você pode visualizar e editar os dados cadastrais das empresas.
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ mt: 2 }}>
          <List>
            {companies.map((company) => (
              <React.Fragment key={company.id}>
                <ListItem
                  secondaryAction={
                    <>
                      <IconButton edge="end" aria-label="toggle-active" onClick={() => handleToggleActive(company)}>
                        {company.is_active ? <LockOpenIcon /> : <LockIcon color="error" />}
                      </IconButton>
                      <IconButton edge="end" aria-label="edit" onClick={() => handleEdit(company)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton edge="end" aria-label="delete" onClick={() => openDeleteConfirm(company)}>
                        <DeleteIcon />
                      </IconButton>
                    </>
                  }
                >
                  <ListItemText
                    primary={company.nome_fantasia || company.nome_completo || 'Nome não informado'}
                    secondary={
                      company.tipo_pessoa === 'FISICA'
                        ? `CPF: ${company.cpf || 'Não informado'}`
                        : `CNPJ: ${company.cnpj || 'Não informado'} | Razão Social: ${company.razao_social || 'Não informada'}`
                    }
                    style={{ textDecoration: company.is_active ? 'none' : 'line-through' }}
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      <EditCompanyModal
        open={isModalOpen}
        onClose={handleCloseModal}
        company={editingCompany}
        onSave={handleSave}
      />

      <Dialog
        open={isConfirmOpen}
        onClose={closeDeleteConfirm}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirmar Exclusão"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Você tem certeza que deseja excluir a empresa "{companyToDelete?.nome_fantasia || companyToDelete?.razao_social}"? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteConfirm}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" autoFocus>
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CompanyManagement;