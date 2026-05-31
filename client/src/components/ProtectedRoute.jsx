import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = () => {
  const { user, loading, profile } = useAuth(); // Usando o loading e profile do contexto

  useEffect(() => {
    // Opcional: você pode adicionar lógicas aqui que dependem da mudança de `user` ou `loading`
    // Por exemplo, forçar uma busca de dados quando o usuário muda.
  }, [user, loading]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se o usuário está logado, renderiza o conteúdo protegido
  // Passa o `profile` obtido do `useAuth` para o `Outlet`
  return <Outlet context={{ profile }} />;
};

export default ProtectedRoute;