import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  CircularProgress
} from '@mui/material';
import { supabase } from '../supabaseClient';
import { useSnackbar } from 'notistack';
import CoverPhotoUpload from './CoverPhotoUpload';

function EditCompanyModal({ open, onClose, company, onSave }) {
  const [formData, setFormData] = useState({
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    cpf: '',
    nome_completo: '',
    slug: '',
    cover_url: null,
  });
  const [saving, setSaving] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  // Função para gerar slug
  const generateSlug = (text) => {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');
  };

  useEffect(() => {
    if (company) {
      setFormData({
        id: company.id,
        razao_social: company.razao_social || '',
        nome_fantasia: company.nome_fantasia || '',
        cnpj: company.cnpj || '',
        cpf: company.cpf || '',
        nome_completo: company.nome_completo || '',
        slug: company.slug || generateSlug(company.nome_fantasia || company.razao_social || company.nome_completo),
        cover_url: company.cover_url || null,
        tipo_pessoa: company.tipo_pessoa || (company.cpf ? 'FISICA' : 'JURIDICA'),
      });
    }
  }, [company]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newFormData = { ...prev, [name]: value };
      
      // Se o nome fantasia for alterado, atualiza o slug automaticamente
      if (name === 'nome_fantasia') {
        newFormData.slug = generateSlug(value);
      }

      return newFormData;
    });
  };

  const handleCoverUpload = (newUrl) => {
    setFormData(prev => ({ ...prev, cover_url: newUrl }));
  };

  const handleSave = async () => {
    // Garante que o slug seja uma string válida para a verificação
    const slugToTest = formData.slug ? formData.slug.trim() : '';

    // Verificação de unicidade do slug
    if (slugToTest) {
      const { data, error } = await supabase
        .from('empresas')
        .select('id')
        .eq('slug', slugToTest)
        .not('id', 'eq', formData.id) // Exclui a própria empresa da verificação
        .single();

      if (data) {
        enqueueSnackbar('Este link (slug) já está em uso por outra empresa. Por favor, escolha outro.', { variant: 'error' });
        return;
      }
      if (error && error.code !== 'PGRST116') { // PGRST116 = "queried row does not exist" (o que é bom)
        enqueueSnackbar(`Erro ao verificar o link: ${error.message}`, { variant: 'error' });
        return;
      }
    }

    const updateData = {
      razao_social: formData.razao_social,
      nome_fantasia: formData.nome_fantasia,
      nome_completo: formData.nome_completo,
      slug: formData.slug,
      cover_url: formData.cover_url,
    };

    setSaving(true);
    const { error: updateError } = await supabase
      .from('empresas')
      .update(updateData)
      .eq('id', formData.id);

    setSaving(false);

    if (updateError) {
      enqueueSnackbar(`Erro ao salvar: ${updateError.message}`, { variant: 'error' });
    } else {
      enqueueSnackbar('Empresa atualizada com sucesso!', { variant: 'success' });
      onSave({ ...company, ...formData }); // Atualiza a lista na página principal
      onClose();
    }
  };

  if (!company) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Editar Empresa</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <CoverPhotoUpload 
              companyId={company.id}
              url={formData.cover_url}
              onUpload={handleCoverUpload}
            />
          </Grid>
          {formData.tipo_pessoa === 'FISICA' ? (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome Completo"
                name="nome_completo"
                value={formData.nome_completo || ''}
                onChange={handleChange}
              />
            </Grid>
          ) : (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Razão Social"
                name="razao_social"
                value={formData.razao_social || ''}
                onChange={handleChange}
              />
            </Grid>
          )}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nome Fantasia / Nome da Empresa"
              name="nome_fantasia"
              value={formData.nome_fantasia || ''}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="CNPJ / CPF"
              name="documento"
              value={formData.cnpj || formData.cpf || ''}
              InputProps={{
                readOnly: true,
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Link da Agenda (Slug)"
              name="slug"
              value={formData.slug || ''}
              onChange={handleChange}
              helperText="Este será o link exclusivo da sua empresa. Use apenas letras minúsculas, números e hífens."
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? <CircularProgress size={24} /> : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditCompanyModal;