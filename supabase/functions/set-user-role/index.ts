import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Conecta ao Supabase com a chave de serviço para ter privilégios de admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Pega o token do usuário que está fazendo a chamada
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user: callingUser } } = await supabaseClient.auth.getUser();

    // Verifica na tabela 'profiles' se o usuário que chama é admin
    const { data: callerProfile, error: callerError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', callingUser.id)
      .single();

    // Se houver erro na busca ou o perfil não for de admin, nega o acesso
    if (callerError || !callerProfile || callerProfile.role !== 'admin') {
      throw new Error("Acesso negado. Somente administradores podem alterar cargos.");
    }

    // Se for admin, continua para alterar o cargo do usuário alvo
    const { userId, role } = await req.json();
    if (!userId || !role) {
      throw new Error("Faltando userId ou role no corpo da requisição.");
    }

    // Atualiza a coluna 'role' na tabela 'profiles' do usuário alvo
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ role: role })
      .eq('id', userId)
      .select();

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});