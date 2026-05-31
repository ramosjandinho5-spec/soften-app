import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSessionAndProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const currentUser = session?.user;
      setUser(currentUser ?? null);

      if (currentUser) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*, empresas!company_id(slug)')
          .eq('id', currentUser.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        if (profileData?.company_id) {
          const { data: companyData, error: companyError } = await supabase
            .from('empresas')
            .select('slug')
            .eq('id', profileData.company_id)
            .single();

          if (companyError) {
            console.error('Erro ao buscar dados da empresa:', companyError);
          } else {
            profileData.empresas = companyData;
          }
        }

        setProfile(profileData ?? null);
        setCompanyId(profileData?.company_id ?? null);
      } else {
        // Garante que o estado seja limpo se não houver usuário
        setProfile(null);
        setCompanyId(null);
      }
    } catch (error) {
      console.error('Erro ao buscar sessão e perfil:', error);
      setUser(null);
      setProfile(null);
      setCompanyId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.id !== user?.id) {
        fetchSessionAndProfile();
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [user, fetchSessionAndProfile]);

  const switchCompany = async (newCompanyId) => {
    console.log(`[AuthContext] INICIANDO TROCA para empresa ID: ${newCompanyId}`);
    const currentUser = user;
    if (!currentUser) {
      console.error("[AuthContext] FALHA: Usuário não autenticado para troca.");
      throw new Error("Usuário não autenticado.");
    }

    console.log(`[AuthContext] 1. ATUALIZANDO profiles no Supabase para user ${currentUser.id}...`);
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({ company_id: newCompanyId })
      .eq('id', currentUser.id)
      .select('*, empresas!company_id(slug)') // Pede o profile atualizado de volta
      .single();

    if (error) {
      console.error("[AuthContext] FALHA na atualização do Supabase:", error);
      throw error;
    }
    
    console.log(`[AuthContext] 2. SUCESSO na atualização. Profile retornado pelo Supabase:`, updatedProfile);
    console.log(`[AuthContext] 3. ATUALIZANDO ESTADO INTERNO (React)...`);
    
    // ATUALIZAÇÃO DIRETA: Usa o dado recém-confirmado pelo DB para evitar race condition.
    setProfile(updatedProfile);
    setCompanyId(updatedProfile.company_id);

    console.log(`[AuthContext] 4. ESTADO ATUALIZADO. Novo companyId no contexto: ${updatedProfile.company_id}`);
    console.log(`[AuthContext] TROCA FINALIZADA.`);
  };

  const value = {
    user,
    profile,
    companyId,
    loading,
    supabase,
    switchCompany, // Exporta a nova função poderosa
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Hook para usar o contexto de autenticação facilmente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};