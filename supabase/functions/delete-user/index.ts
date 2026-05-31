import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log('INFO: Carregando a função delete-user');

serve(async (req) => {
  console.log('INFO: Requisição recebida para delete-user');
  if (req.method === 'OPTIONS') {
    console.log('INFO: Respondendo à requisição OPTIONS (preflight)');
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log('INFO: Cliente Supabase Admin (service_role) inicializado.');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    console.log('INFO: Cliente Supabase (anon_key) para verificação de usuário inicializado.');

    const { data: { user: callingUser } } = await supabaseClient.auth.getUser();
    console.log(`INFO: Usuário que está chamando a função: ${callingUser?.email} (ID: ${callingUser?.id})`);

    if (callingUser?.user_metadata?.user_role !== 'admin') {
      console.error(`ERRO DE PERMISSÃO: Usuário ${callingUser?.email} não é admin. Role atual: ${callingUser?.user_metadata?.user_role}`);
      throw new Error("Acesso negado. Somente administradores podem excluir usuários.");
    }
    console.log('INFO: Verificação de permissão (admin) bem-sucedida.');

    const { userId } = await req.json();
    console.log(`INFO: Tentando excluir usuário com ID: ${userId}`);
    if (!userId) {
      console.error('ERRO: userId não foi fornecido no corpo da requisição.');
      throw new Error("Faltando userId no corpo da requisição.");
    }

    // 1. Deletar as associações do usuário com empresas
    console.log(`INFO: Deletando associações de empresa para o usuário ID: ${userId}`);
    const { error: companyUserError } = await supabaseAdmin
      .from('company_users')
      .delete()
      .eq('user_id', userId);

    if (companyUserError) {
      console.error('ERRO CRÍTICO ao deletar de company_users:', JSON.stringify(companyUserError, null, 2));
      throw new Error(`Falha ao remover usuário das empresas: ${companyUserError.message}`);
    }
    console.log(`SUCESSO: Associações de empresa para o usuário ${userId} deletadas.`);

    // 2. Deletar o perfil do usuário para evitar erro de chave estrangeira
    console.log(`INFO: Deletando perfil para o usuário ID: ${userId}`);
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('ERRO CRÍTICO ao deletar perfil:', JSON.stringify(profileError, null, 2));
      throw new Error(`Falha ao deletar o perfil do usuário: ${profileError.message}`);
    }
    console.log(`SUCESSO: Perfil para o usuário ${userId} deletado.`);

    // 2. Agora, deletar o usuário do Auth
    console.log(`INFO: Executando auth.admin.deleteUser para o ID: ${userId}`);
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('ERRO CRÍTICO ao excluir usuário do Auth:', JSON.stringify(authError, null, 2));
      if (authError.message.includes("owner")) {
        throw new Error("Não é possível excluir o proprietário do projeto.");
      }
      throw authError;
    }
    console.log(`SUCESSO: Usuário ${userId} excluído do Auth.`);

    return new Response(JSON.stringify({ message: "Usuário excluído com sucesso." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('ERRO GERAL na execução da função:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});