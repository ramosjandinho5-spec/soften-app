import React, { useState, useRef } from 'react';
import { Avatar, Badge, IconButton, CircularProgress, Box } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import BusinessIcon from '@mui/icons-material/Business';
import { useSnackbar } from 'notistack';
import { supabase } from '../supabaseClient';

export default function LogoAvatar({ userId, companyId, url, onUpload }) {
  const [uploading, setUploading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const fileInputRef = useRef(null);

  const handleAvatarClick = () => {
    if (!uploading) {
      fileInputRef.current.click();
    }
  };

  const uploadAvatar = async (event) => {
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

      const { error: uploadError } = await supabase.storage
        .from('company_logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('company_logos')
        .getPublicUrl(filePath);

      onUpload(`${publicUrl}?t=${new Date().getTime()}`);
      enqueueSnackbar('Logo atualizado com sucesso!', { variant: 'success' });

    } catch (error) {
      enqueueSnackbar(`Erro ao fazer upload do logo: ${error.message}`, { variant: 'error' });
    } finally {
      setUploading(false);
      // Reset file input
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4, position: 'relative' }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={uploadAvatar}
        style={{ display: 'none' }}
        accept="image/png, image/jpeg"
        disabled={uploading}
      />
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        badgeContent={
          <IconButton
            onClick={handleAvatarClick}
            disabled={uploading}
            sx={{
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': { backgroundColor: 'action.hover' }
            }}
          >
            <EditIcon />
          </IconButton>
        }
      >
        <Avatar
          src={url}
          onClick={handleAvatarClick}
          sx={{ 
            width: 120, 
            height: 120, 
            border: '2px solid', 
            borderColor: 'divider',
            cursor: 'pointer'
          }}
        >
          {!url && <BusinessIcon sx={{ width: 60, height: 60 }} />}
        </Avatar>
      </Badge>
      {uploading && (
        <CircularProgress
          size={128}
          sx={{
            color: 'primary.main',
            position: 'absolute',
            top: -4,
            left: '50%',
            marginLeft: '-64px',
            zIndex: 1,
          }}
        />
      )}
    </Box>
  );
}