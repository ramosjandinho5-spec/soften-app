import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = () => {
  const { user, supabase } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileAndCompany = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch the user's profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        // 2. Fetch the associated company
        const { data: companyData, error: companyError } = await supabase
          .from('empresas')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        // It's okay if a company doesn't exist, so we only throw for other errors.
        if (companyError && companyError.code !== 'PGRST116') {
          throw companyError;
        }

        // 3. Combine the data, mimicking the original structure
        const combinedData = {
          ...profileData,
          empresas: companyData ? [companyData] : [],
        };
        
        setProfile(combinedData);

      } catch (error) {
        console.error('Error fetching profile and company data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndCompany();
  }, [user, supabase]);

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

  return <Outlet context={{ profile }} />;
};

export default ProtectedRoute;