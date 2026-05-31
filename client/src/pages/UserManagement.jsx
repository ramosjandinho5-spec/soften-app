import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Button,
  useTheme,
  useMediaQuery
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import InviteUserModal from '../components/InviteUserModal';
import ConfirmationDialog from '../components/ConfirmationDialog';
import UserModulesModal from '../components/UserModulesModal';
import { supabase } from '../supabaseClient';
import { useSnackbar } from 'notistack';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [isConfirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isModulesModalOpen, setModulesModalOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('get-users');


    if (error) {
      const functionError = error.context?.json?.error || error.message;
      enqueueSnackbar(`Erro ao buscar usuários: ${functionError}`, { variant: 'error' });
    } else {
      setUsers(data.users);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleMenuClick = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleToggleAdmin = async () => {
    if (!selectedUser) return;

    const currentRole = selectedUser.role || 'user';
    const newRole = currentRole === 'admin' ? 'user' : 'admin';

    const { error } = await supabase.functions.invoke('set-user-role', {
      body: { userId: selectedUser.id, role: newRole },
    });

    if (error) {
      const functionError = error.context?.json?.error || error.message;
      enqueueSnackbar(`Erro ao alterar cargo: ${functionError}`, { variant: 'error' });
    } else {
      enqueueSnackbar(`Cargo de ${selectedUser.email} alterado para ${newRole}.`, { variant: 'success' });
      fetchUsers();
    }
    handleMenuClose();
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user); // Garante que o usuário está selecionado
    setConfirmDialogOpen(true);
    setAnchorEl(null);
  };

  const handleModulesClick = () => {
    setAnchorEl(null);
    setModulesModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) {
      enqueueSnackbar('Erro: Nenhum usuário selecionado para exclusão.', { variant: 'error' });
      setConfirmDialogOpen(false);
      return;
    }

    const userToDelete = selectedUser; // Copia para uma variável local
    setConfirmDialogOpen(false); // Fecha o diálogo primeiro
    
    const { error } = await supabase.functions.invoke('delete-user', {
      body: { userId: userToDelete.id },
    });

    if (error) {
      const functionError = error.context?.json?.error || error.message;
      enqueueSnackbar(`Erro ao excluir usuário: ${functionError}`, { variant: 'error' });
    } else {
      enqueueSnackbar(`Usuário ${userToDelete.email} excluído com sucesso.`, { variant: 'success' });
      fetchUsers();
    }
    setSelectedUser(null); // Limpa o estado global no final
  };

  const handleInviteUser = async ({ email, fullName }) => {
    const { error } = await supabase.functions.invoke('invite-user', {
      body: { email, fullName },
    });

    if (error) {
      enqueueSnackbar(`Erro ao enviar convite: ${error.message}`, { variant: 'error' });
    } else {
      enqueueSnackbar(`Convite enviado com sucesso para ${email}.`, { variant: 'success' });
      fetchUsers();
    }
    setInviteModalOpen(false);
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
    setSelectedUser(null); // Limpa o usuário selecionado ao cancelar
  };

  return (
    <Box>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        flexDirection: isMobile ? 'column' : 'row',
        mb: 2,
        gap: 2
      }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Gerenciamento de Usuários
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Aqui você pode convidar, visualizar e gerenciar os usuários do sistema.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setInviteModalOpen(true)}
          sx={{ width: isMobile ? '100%' : 'auto' }}
        >
          Convidar Usuário
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : isMobile ? (
        <Box>
          {users.map((user) => (
            <Paper key={user.id} sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6">{user.user_metadata?.full_name || 'Não informado'}</Typography>
                  <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                </Box>
                <IconButton aria-label="actions" onClick={(e) => handleMenuClick(e, user)}>
                  <MoreVertIcon />
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                <Chip 
                  label={user.role || 'user'} 
                  color={user.role === 'admin' ? 'primary' : 'default'}
                  size="small"
                />
                <Typography variant="caption" color="text.secondary">
                  Criado em: {new Date(user.created_at).toLocaleDateString()}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      ) : (
        <Paper sx={{ mt: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Função</TableCell>
                  <TableCell>Data de Criação</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.user_metadata?.full_name || 'Não informado'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.user_metadata?.user_role || 'user'} 
                        color={user.user_metadata?.user_role === 'admin' ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <IconButton aria-label="actions" onClick={(e) => handleMenuClick(e, user)}>
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleToggleAdmin}>
          {selectedUser?.user_metadata?.user_role === 'admin' ? 'Rebaixar para Usuário' : 'Promover a Admin'}
        </MenuItem>
        <MenuItem onClick={() => handleDeleteClick(selectedUser)} sx={{ color: 'error.main' }}>
          Excluir
        </MenuItem>
        <MenuItem onClick={handleModulesClick}>
            Gerenciar Módulos
        </MenuItem>
      </Menu>

      <InviteUserModal
        open={isInviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onInvite={handleInviteUser}
      />

    <ConfirmationDialog
        open={isConfirmDialogOpen}
        onClose={handleCloseConfirmDialog}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir o usuário ${selectedUser?.email}? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
    />

    <UserModulesModal
        open={isModulesModalOpen}
        onClose={() => {
            setModulesModalOpen(false);
            fetchUsers(); // Atualiza a lista de usuários para refletir as mudanças
        }}
        user={selectedUser}
    />
    </Box>
  );
}

export default UserManagement;