import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  CircularProgress,
  Typography,
  Box,
  Collapse,
  ListItemButton
} from '@mui/material';
import { supabase } from '../supabaseClient';
import { useSnackbar } from 'notistack';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

import { menuConfig } from '../config/menuConfig.jsx';

function UserModulesModal({ open, onClose, user }) {
  const [userModules, setUserModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openCollapse, setOpenCollapse] = useState({});
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (user) {
      const allowedModules = user.user_metadata?.allowed_modules || [];
      setUserModules(allowedModules);
    }
  }, [user]);

  const handleCollapseClick = (id) => {
    setOpenCollapse(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleModule = (moduleId, subItems = []) => {
    setUserModules(prevModules => {
      const newModules = new Set(prevModules);
      const isEnabling = !newModules.has(moduleId);

      if (isEnabling) {
        newModules.add(moduleId);
        // Se for um item principal, habilita todos os sub-itens
        subItems.forEach(sub => newModules.add(sub.id));
      } else {
        newModules.delete(moduleId);
        // Se for um item principal, desabilita todos os sub-itens
        subItems.forEach(sub => newModules.delete(sub.id));
      }
      
      return Array.from(newModules);
    });
  };

  const handleToggleSubModule = (subModuleId, parentId) => {
    setUserModules(prevModules => {
        const newModules = new Set(prevModules);
        if (newModules.has(subModuleId)) {
            newModules.delete(subModuleId);
        } else {
            newModules.add(subModuleId);
            // Garante que o módulo pai esteja habilitado se um filho for
            newModules.add(parentId);
        }
        return Array.from(newModules);
    });
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    const { error } = await supabase.functions.invoke('set-user-modules', {
        body: { userId: user.id, modules: userModules },
    });

    setLoading(false);

    if (error) {
      enqueueSnackbar(`Erro ao salvar módulos: ${error.message}`, { variant: 'error' });
    } else {
      enqueueSnackbar('Módulos atualizados com sucesso!', { variant: 'success' });
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Gerenciar Módulos para {user?.user_metadata?.full_name || user?.email}</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {menuConfig.map((item) => (
              <React.Fragment key={item.id}>
                {item.subItems ? (
                  <>
                    <ListItemButton onClick={() => handleCollapseClick(item.id)}>
                      <ListItemText primary={item.text} />
                      <Switch
                        edge="end"
                        onChange={(e) => {
                            e.stopPropagation(); // Impede que o clique no switch propague para o ListItemButton
                            handleToggleModule(item.id, item.subItems);
                        }}
                        checked={userModules.includes(item.id)}
                      />
                      {openCollapse[item.id] ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                    <Collapse in={openCollapse[item.id]} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding sx={{ pl: 4 }}>
                        {item.subItems.map((subItem) => (
                          <ListItem key={subItem.id}>
                            <ListItemText primary={subItem.text} />
                            <Switch
                              edge="end"
                              onChange={() => handleToggleSubModule(subItem.id, item.id)}
                              checked={userModules.includes(subItem.id)}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Collapse>
                  </>
                ) : (
                  <ListItem>
                    <ListItemText primary={item.text} />
                    <Switch
                      edge="end"
                      onChange={() => handleToggleModule(item.id)}
                      checked={userModules.includes(item.id)}
                    />
                  </ListItem>
                )}
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" disabled={loading}>
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default UserModulesModal;