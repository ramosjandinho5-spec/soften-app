import React, { useState, useRef } from 'react';
import { Box, IconButton, CircularProgress, Typography, Paper } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PhotoCameraBackIcon from '@mui/icons-material/PhotoCameraBack';
import { useSnackbar } from 'notistack';
import { supabase } from '../supabaseClient';

export default function CoverPhotoUpload({ companyId, url, onUpload }) {
  const [uploading, setUploading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const fileInputRef = useRef(null);

  const handleBoxClick = () => {
    if (!uploading) {
      fileInputRef.current.click();
    }
  };

  const uploadCover = async (event) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você precisa selecionar uma imagem para fazer o upload.');
      }

      if (!companyId) {
        throw new Error('ID da empresa não encontrado. Salve as informações da empresa primeiro.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${companyId}.${fileExt}`;

      // Usar um bucket diferente para as capas
      const { error: uploadError } = await supabase.storage
        .from('company_covers')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }
      
      const { data } = supabase.storage
        .from('company_covers')
        .getPublicUrl(filePath);

      if (!data || !data.publicUrl) {
        throw new Error('Não foi possível obter a URL pública da imagem.');
      }

      // Adiciona um timestamp para evitar problemas de cache do navegador
      const finalUrl = `${data.publicUrl}?t=${new Date().getTime()}`;

      onUpload(finalUrl);
      enqueueSnackbar('Foto da capa atualizada com sucesso!', { variant: 'success' });

    } catch (error) {
      enqueueSnackbar(`Erro ao fazer upload da capa: ${error.message}`, { variant: 'error' });
    } finally {
      setUploading(false);
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', mb: 2 }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={uploadCover}
        style={{ display: 'none' }}
        accept="image/png, image/jpeg"
        disabled={uploading}
      />
      <Typography variant="subtitle1" gutterBottom>Foto da Capa</Typography>
      <Paper
        onClick={handleBoxClick}
        sx={{
          width: '100%',
          height: 150,
          border: '2px dashed',
          borderColor: 'divider',
          cursor: 'pointer',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          backgroundImage: url ? `url(${url})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'text.secondary',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover'
          }
        }}
      >
        {uploading && (
          <CircularProgress
            size={60}
            sx={{
              position: 'absolute',
            }}
          />
        )}
        {!uploading && !url && (
          <>
            <PhotoCameraBackIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography>Clique para enviar</Typography>
          </>
        )}
        {!uploading && (
           <IconButton
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              '&:hover': { backgroundColor: 'white' }
            }}
          >
            <EditIcon />
          </IconButton>
        )}
      </Paper>
    </Box>
  );
}