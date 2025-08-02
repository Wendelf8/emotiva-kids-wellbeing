-- Criar as políticas RLS para a tabela checkins_emocionais
ALTER TABLE public.checkins_emocionais ENABLE ROW LEVEL SECURITY;

-- Criar políticas para a tabela checkins_emocionais
CREATE POLICY "Usuário pode ver seus próprios check-ins"
ON public.checkins_emocionais
FOR SELECT
USING (
  crianca_id IN (
    SELECT id FROM public.criancas WHERE usuario_id = auth.uid()
  )
);

CREATE POLICY "Usuário pode inserir check-ins para suas crianças"
ON public.checkins_emocionais
FOR INSERT
WITH CHECK (
  crianca_id IN (
    SELECT id FROM public.criancas WHERE usuario_id = auth.uid()
  )
);

CREATE POLICY "Usuário pode atualizar seus próprios check-ins"
ON public.checkins_emocionais
FOR UPDATE
USING (
  crianca_id IN (
    SELECT id FROM public.criancas WHERE usuario_id = auth.uid()
  )
)
WITH CHECK (
  crianca_id IN (
    SELECT id FROM public.criancas WHERE usuario_id = auth.uid()
  )
);

CREATE POLICY "Usuário pode deletar seus próprios check-ins"
ON public.checkins_emocionais
FOR DELETE
USING (
  crianca_id IN (
    SELECT id FROM public.criancas WHERE usuario_id = auth.uid()
  )
);

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_checkins_emocionais_crianca_data 
ON public.checkins_emocionais (crianca_id, data);

CREATE INDEX IF NOT EXISTS idx_checkins_emocionais_data 
ON public.checkins_emocionais (data);