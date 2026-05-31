-- Habilita a extensão pgcrypto se ainda não estiver habilitada (necessária para uuid_generate_v4)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela para vincular usuários a empresas (muitos-para-muitos)
-- Assumindo que a tabela 'empresas' já existe.
CREATE TABLE public.empresa_usuarios (
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (empresa_id, user_id)
);
COMMENT ON TABLE public.empresa_usuarios IS 'Tabela de junção para associar usuários a empresas.';

-- Tabela para armazenar as sessões do caixa
CREATE TABLE public.caixa_sessoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.empresas(id),
  usuario_id UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT NOT NULL CHECK (status IN ('ABERTO', 'FECHADO')),
  data_abertura TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_fechamento TIMESTAMPTZ,
  valor_inicial NUMERIC(10, 2) NOT NULL,
  valor_final_informado NUMERIC(10, 2),
  diferenca NUMERIC(10, 2),
  observacao_fechamento TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.caixa_sessoes IS 'Armazena cada sessão de caixa, desde a abertura até o fechamento.';

-- Tabela para armazenar as movimentações de cada sessão de caixa
CREATE TABLE public.caixa_movimentacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sessao_id UUID NOT NULL REFERENCES public.caixa_sessoes(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.empresas(id),
  usuario_id UUID NOT NULL REFERENCES public.profiles(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('ABERTURA', 'SANGRIA', 'SUPRIMENTO', 'VENDA')),
  valor NUMERIC(10, 2) NOT NULL,
  descricao TEXT,
  data_movimentacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.caixa_movimentacoes IS 'Registra todas as transações financeiras dentro de uma sessão de caixa.';

-- Habilitar Row Level Security (RLS) para as novas tabelas
ALTER TABLE public.empresa_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixa_sessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixa_movimentacoes ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Enable read access for company members" 
ON public.empresa_usuarios FOR SELECT 
USING (empresa_id IN (SELECT empresa_id FROM public.empresa_usuarios WHERE user_id = auth.uid()));

CREATE POLICY "Enable all access for company members on caixa_sessoes" 
ON public.caixa_sessoes FOR ALL 
USING (company_id IN (SELECT empresa_id FROM public.empresa_usuarios WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT empresa_id FROM public.empresa_usuarios WHERE user_id = auth.uid()));

CREATE POLICY "Enable all access for company members on caixa_movimentacoes" 
ON public.caixa_movimentacoes FOR ALL 
USING (company_id IN (SELECT empresa_id FROM public.empresa_usuarios WHERE user_id = auth.uid()))
WITH CHECK (company_id IN (SELECT empresa_id FROM public.empresa_usuarios WHERE user_id = auth.uid()));