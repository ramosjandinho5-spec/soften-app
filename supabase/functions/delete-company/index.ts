import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

console.log('INFO: Carregando a função delete-company');

serve(async (req) => {
  console.log('INFO: Requisição recebida para delete-company');
  if (req.method === 'OPTIONS') {
    console.log('INFO: Respondendo à requisição OPTIONS (preflight)');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log('INFO: Cliente Supabase Admin inicializado.');

    const { companyId } = await req.json();
    console.log(`INFO: Tentando excluir empresa com ID: ${companyId}`);
    if (!companyId) {
      console.error('ERRO: companyId não foi fornecido no corpo da requisição.');
      throw new Error('O ID da empresa é obrigatório.');
    }

    const tablesToClean = ['vendas', 'clientes', 'profiles', 'caixa_sessoes', 'caixa_movimentacoes'];
    console.log(`INFO: Iniciando limpeza de tabelas associadas: ${tablesToClean.join(', ')}`);

    for (const table of tablesToClean) {
      console.log(`INFO: Limpando tabela: ${table}`);
      const { error: updateError } = await supabaseAdmin
        .from(table)
        .update({ company_id: null })
        .eq('company_id', companyId);

      if (updateError) {
        console.error(`ERRO CRÍTICO ao limpar a tabela ${table}:`, JSON.stringify(updateError, null, 2));
        throw new Error(`Erro de permissão ou referência ao tentar limpar a tabela ${table}.`);
      }
      console.log(`SUCESSO: Tabela ${table} limpa.`);
    }

    console.log('INFO: Todas as tabelas associadas foram limpas. Excluindo a empresa principal...');
    const { error: deleteError } = await supabaseAdmin
      .from('empresas')
      .delete()
      .eq('id', companyId);

    if (deleteError) {
      console.error('ERRO CRÍTICO ao excluir a empresa:', JSON.stringify(deleteError, null, 2));
      throw new Error('Não foi possível excluir o registro principal da empresa após a limpeza.');
    }

    console.log(`SUCESSO: Empresa ${companyId} excluída.`);
    return new Response(JSON.stringify({ message: 'Empresa e todas as suas referências foram excluídas com sucesso.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('ERRO GERAL na execução da função:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});