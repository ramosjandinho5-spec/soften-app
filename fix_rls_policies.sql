-- =================================================================
-- CORREÇÃO DAS POLÍTICAS DE SEGURANÇA (RLS)
-- Motivo: Corrigir erro de "infinite recursion" na tabela 'empresa_usuarios'.
-- =================================================================

-- 1. Remover as políticas antigas que estão causando o problema.
--    Os nomes devem ser exatamente os mesmos que foram criados no script anterior.
DROP POLICY IF EXISTS "Enable read access for company members" ON public.empresa_usuarios;
DROP POLICY IF EXISTS "Enable all access for company members on caixa_sessoes" ON public.caixa_sessoes;
DROP POLICY IF EXISTS "Enable all access for company members on caixa_movimentacoes" ON public.caixa_movimentacoes;


-- 2. Criar a nova política correta para 'empresa_usuarios'.
--    Esta política, mais simples, permite que um usuário veja seu próprio vínculo com uma empresa,
--    o que quebra a recursão infinita.
CREATE POLICY "Permitir que usuários vejam seus próprios vínculos com empresas"
ON public.empresa_usuarios
FOR SELECT
USING (auth.uid() = user_id);


-- 3. Recriar as políticas para as tabelas de caixa, que agora funcionarão corretamente.
--    Estas políticas dependem da consulta à 'empresa_usuarios', que agora é segura.
CREATE POLICY "Permitir acesso total para membros da empresa em caixa_sessoes"
ON public.caixa_sessoes
FOR ALL
USING (company_id IN (SELECT empresa_id FROM public.empresa_usuarios WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT empresa_id FROM public.empresa_usuarios WHERE user_id = auth.uid()));

CREATE POLICY "Permitir acesso total para membros da empresa em caixa_movimentacoes"
ON public.caixa_movimentacoes
FOR ALL
USING (company_id IN (SELECT empresa_id FROM public.empresa_usuarios WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT empresa_id FROM public.empresa_usuarios WHERE user_id = auth.uid()));