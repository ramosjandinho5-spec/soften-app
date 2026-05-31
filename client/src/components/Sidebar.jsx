import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import logo from '../assets/images/organiza.png';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
  Collapse,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import InventoryIcon from '@mui/icons-material/Inventory';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import GroupIcon from '@mui/icons-material/Group';
import WidgetsIcon from '@mui/icons-material/Widgets';
import MiscellaneousServicesIcon from '@mui/icons-material/MiscellaneousServices';
import BadgeIcon from '@mui/icons-material/Badge';
import EventIcon from '@mui/icons-material/Event';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';

const drawerWidth = 240;

import { menuConfig } from '../config/menuConfig.jsx';

import { supabase } from '../supabaseClient';

function Sidebar({ open: drawerOpen, handleDrawerClose, hasCompany, onMenuClick }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState({});
  const [visibleMenuItems, setVisibleMenuItems] = useState([]);

  useEffect(() => {
    const fetchUserAndFilterMenu = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      const allowedModules = user?.user_metadata?.allowed_modules;

      if (!allowedModules) {
        setVisibleMenuItems(menuConfig);
        return;
      }

      const filteredMenu = menuConfig.map(item => {
        if (!item.subItems) {
          return allowedModules.includes(item.id) ? item : null;
        }
        const visibleSubItems = item.subItems.filter(subItem => allowedModules.includes(subItem.id));
        if (visibleSubItems.length > 0) {
          return { ...item, subItems: visibleSubItems };
        }
        return null;
      }).filter(Boolean);

      setVisibleMenuItems(filteredMenu);
    };

    fetchUserAndFilterMenu();
  }, []);

  const handleItemClick = (item) => {
    const allowedRoutes = ['dashboard', 'configuracoes'];
    if (!hasCompany && !allowedRoutes.includes(item.id)) {
      onMenuClick();
    } else {
      navigate(item.path);
      if (handleDrawerClose) handleDrawerClose();
    }
  };

  const handleGroupClick = (text) => {
    setOpen(prevOpen => ({
      ...prevOpen,
      [text]: !prevOpen[text]
    }));
  };

  return (
    <Drawer
      variant="permanent"
      open={drawerOpen}
      sx={{
        width: drawerOpen ? drawerWidth : 60,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerOpen ? drawerWidth : 60,
          boxSizing: 'border-box',
          backgroundColor: '#2e96f1',
          color: '#FFFFFF',
          overflowX: 'hidden',
          transition: (theme) => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        },
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', height: '44px', pr: 0, pl: 0 }}>
        {drawerOpen ? (
          <>
            <img src={logo} alt="Core Sync Logo" style={{ maxHeight: '85px', marginLeft: '30px', marginTop: '-30px' }} />
          </>
        ) : (
          <div />
        )}
      </Toolbar>
      <Box sx={{ 
        overflowY: 'auto', 
        overflowX: 'hidden',
        '&::-webkit-scrollbar': { display: 'none' },
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }}>
        <List>
          {visibleMenuItems.map((item) => (
            <React.Fragment key={item.text}>
              {item.subItems ? (
                <>
                  <ListItemButton onClick={() => handleGroupClick(item.text)}>
                    <ListItemIcon sx={{ color: '#FFFFFF' }}>{item.icon}</ListItemIcon>
                    {drawerOpen && <ListItemText primary={item.text} />}
                    {drawerOpen && (open[item.text] ? <ExpandLess /> : <ExpandMore />)}
                  </ListItemButton>
                  <Collapse in={open[item.text] && drawerOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {item.subItems.map((subItem) => (
                        <ListItemButton 
                          key={subItem.text} 
                          sx={{ pl: 4 }} 
                          onClick={() => handleItemClick(subItem)}
                        >
                          <ListItemIcon sx={{ color: '#FFFFFF' }}>{subItem.icon}</ListItemIcon>
                          {drawerOpen && <ListItemText primary={subItem.text} primaryTypographyProps={{ style: { fontSize: '0.875rem' } }} />}
                        </ListItemButton>
                      ))}
                    </List>
                  </Collapse>
                </>
              ) : (
                <ListItem disablePadding>
                  <ListItemButton onClick={() => handleItemClick(item)}>
                    <ListItemIcon sx={{ color: '#FFFFFF' }}>{item.icon}</ListItemIcon>
                    {drawerOpen && <ListItemText primary={item.text} />}
                  </ListItemButton>
                </ListItem>
              )}
            </React.Fragment>
          ))}
        </List>
      </Box>
    </Drawer>
  );
}

export default Sidebar;