import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Tabs,
  Tab,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Grid,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import { supabase } from '../supabaseClient';

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

const HomeTutorial = () => {
  const [tabValue, setTabValue] = useState(0);
  const [homeVideoLink, setHomeVideoLink] = useState('');
  const [tutorials, setTutorials] = useState([
    { id: 1, title: 'Musica', description: 'Eletrônica', link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    { id: 2, title: 'teste', description: 'teste 2', link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  ]);
  const [newTutorial, setNewTutorial] = useState({ title: '', description: '', link: '' });

  useEffect(() => {
    const fetchHomeVideoLink = async () => {
      const { data, error } = await supabase
        .from('config')
        .select('home_video_link')
        .single();

      if (error) {
        console.error('Error fetching home video link:', error);
      } else if (data) {
        setHomeVideoLink(data.home_video_link);
      }
    };

    fetchHomeVideoLink();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSaveHome = async () => {
    const { error } = await supabase
      .from('config')
      .update({ home_video_link: homeVideoLink })
      .eq('id', 1); // Assuming a single row with id 1

    if (error) {
      console.error('Error saving home video link:', error);
    } else {
      console.log('Home video link saved successfully!');
    }
  };

  const handleSaveTutorial = () => {
    setTutorials([...tutorials, { ...newTutorial, id: Date.now() }]);
    setNewTutorial({ title: '', description: '', link: '' });
    console.log('Saving new tutorial:', newTutorial);
    // Aqui você adicionaria a lógica para salvar o tutorial no backend
  };
  
  const handleDeleteTutorial = (id) => {
    setTutorials(tutorials.filter(tutorial => tutorial.id !== id));
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Gerenciar Home e Tutoriais
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="basic tabs example">
          <Tab label="Home" />
          <Tab label="Tutorial" />
        </Tabs>
      </Box>

      {/* Home Tab */}
      <TabPanel value={tabValue} index={0}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Vídeo da Página Inicial
        </Typography>
        <TextField
          fullWidth
          label="Cole o link do vídeo aqui"
          variant="outlined"
          value={homeVideoLink}
          onChange={(e) => setHomeVideoLink(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button variant="contained" onClick={handleSaveHome}>
          Salvar
        </Button>
      </TabPanel>

      {/* Tutorial Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Adicionar Novo Tutorial
            </Typography>
            <TextField
              fullWidth
              label="Título do vídeo"
              variant="outlined"
              value={newTutorial.title}
              onChange={(e) => setNewTutorial({ ...newTutorial, title: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Breve descrição do vídeo"
              variant="outlined"
              multiline
              rows={3}
              value={newTutorial.description}
              onChange={(e) => setNewTutorial({ ...newTutorial, description: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Cole o link do YouTube aqui"
              variant="outlined"
              value={newTutorial.link}
              onChange={(e) => setNewTutorial({ ...newTutorial, link: e.target.value })}
              sx={{ mb: 2 }}
            />
            <Button variant="contained" onClick={handleSaveTutorial}>
              Salvar Tutorial
            </Button>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Tutoriais Existentes
            </Typography>
            {tutorials.map((tutorial) => (
              <Card key={tutorial.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6">{tutorial.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tutorial.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <IconButton size="small" color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDeleteTutorial(tutorial.id)}>
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            ))}
          </Grid>
        </Grid>
      </TabPanel>
    </Container>
  );
};

export default HomeTutorial;