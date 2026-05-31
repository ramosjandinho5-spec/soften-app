import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Typography,
  Modal,
  Box,
  Button,
} from '@mui/material';
import HomeOutlined from '@mui/icons-material/HomeOutlined';
import Logout from '@mui/icons-material/Logout';
import PersonOutline from '@mui/icons-material/PersonOutline';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90vw', sm: 400 },
  bgcolor: 'background.paper',
  borderRadius: '8px',
  boxShadow: 24,
  p: 4,
  textAlign: 'center',
};

const ProfileMenu = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSwitchCompany = () => {
    handleClose();
    navigate('/trocar-empresa');
  };

  const handleLogout = async () => {
    handleClose();
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleProfile = () => {
    handleClose();
    navigate('/perfil');
  };

  const getInitials = (name) => {
    if (!name) return 'U'; // "U" de Usuário
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <>
      <IconButton onClick={handleClick} size="small">
        <Avatar 
          sx={{ width: 40, height: 40 }}
          src={user?.user_metadata?.avatar_url}
        >
          {/* Só mostra as iniciais se não houver avatar_url */}
          {!user?.user_metadata?.avatar_url && getInitials(user?.user_metadata?.full_name)}
        </Avatar>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1,
            boxShadow: '0px 5px 25px rgba(0,0,0,0.1)',
          }
        }}
      >
        <MenuItem disabled>
            <Typography variant="button">BEM-VINDO!</Typography>
        </MenuItem>
        <MenuItem onClick={handleProfile}>
          <ListItemIcon>
            <PersonOutline fontSize="small" />
          </ListItemIcon>
          Meu perfil
        </MenuItem>
        <MenuItem onClick={handleSwitchCompany}>
          <ListItemIcon>
            <HomeOutlined fontSize="small" />
          </ListItemIcon>
          Acessar outra Empresa
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Sair
        </MenuItem>
      </Menu>
    </>
  );
};

export default ProfileMenu;