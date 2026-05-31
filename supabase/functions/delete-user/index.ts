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

    console.log(`INFO: Executando auth.admin.deleteUser para o ID: ${userId}`);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      console.error('ERRO CRÍTICO ao excluir usuário do Auth:', JSON.stringify(error, null, 2));
      if (error.message.includes("owner")) {
        throw new Error("Não é possível excluir o proprietário do projeto.");
      }
      throw error;
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