import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton, Menu, MenuItem, ListItemIcon, Typography } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';

function SettingsMenu() {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path) => {
    if (path === '/empresa') {
      const preference = localStorage.getItem('registration_preference');
      if (preference === 'PF') {
        navigate('/cadastro-pf');
      } else {
        navigate('/empresa');
      }
    } else {
      navigate(path);
    }
    handleClose();
  };

  return (
    <div>
      <IconButton
        aria-label="account of current user"
        aria-controls="menu-appbar"
        aria-haspopup="true"
        onClick={handleMenu}
        color="inherit"
      >
        <BusinessIcon color="action" />
      </IconButton>
      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        sx={{ mt: '45px' }}
      >
        <MenuItem onClick={() => handleNavigate('/empresa')}>
          <ListItemIcon>
            <BusinessIcon fontSize="small" />
          </ListItemIcon>
          <Typography variant="inherit">Cadastro da Empresa</Typography>
        </MenuItem>
      </Menu>
    </div>
  );
}

export default SettingsMenu;