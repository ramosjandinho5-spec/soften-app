import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab, Paper, Container } from '@mui/material';
import CompanyManagement from './CompanyManagement';
import UserManagement from './UserManagement';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function SystemSettings() {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Container maxWidth={false} sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Configurações do Sistema
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Gerencie os dados de empresas e usuários da aplicação.
        </Typography>
      </Box>
      <Paper>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="abas de configurações do sistema">
            <Tab label="Empresas" />
            <Tab label="Usuários" />
          </Tabs>
        </Box>
        <TabPanel value={value} index={0}>
          <CompanyManagement />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <UserManagement />
        </TabPanel>
      </Paper>
    </Container>
  );
}

export default SystemSettings;