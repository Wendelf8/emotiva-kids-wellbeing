-- Criar tabela para vincular pais aos alunos da escola
CREATE TABLE IF NOT EXISTS public.aluno_responsaveis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  responsavel_email TEXT NOT NULL,
  responsavel_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aceito', 'recusado')),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX idx_aluno_responsaveis_aluno ON public.aluno_responsaveis(aluno_id);
CREATE INDEX idx_aluno_responsaveis_email ON public.aluno_responsaveis(responsavel_email);
CREATE INDEX idx_aluno_responsaveis_user ON public.aluno_responsaveis(responsavel_user_id);

-- Habilitar RLS
ALTER TABLE public.aluno_responsaveis ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Escolas podem gerenciar responsáveis de seus alunos
CREATE POLICY "Escolas podem ver responsáveis de seus alunos"
ON public.aluno_responsaveis FOR SELECT
USING (
  aluno_id IN (
    SELECT a.id FROM public.alunos a
    JOIN public.turmas t ON a.turma_id = t.id
    WHERE t.escola_id = auth.uid()
  ) AND is_escola_user(auth.uid())
);

CREATE POLICY "Escolas podem adicionar responsáveis"
ON public.aluno_responsaveis FOR INSERT
WITH CHECK (
  aluno_id IN (
    SELECT a.id FROM public.alunos a
    JOIN public.turmas t ON a.turma_id = t.id
    WHERE t.escola_id = auth.uid()
  ) AND is_escola_user(auth.uid())
);

CREATE POLICY "Escolas podem atualizar responsáveis"
ON public.aluno_responsaveis FOR UPDATE
USING (
  aluno_id IN (
    SELECT a.id FROM public.alunos a
    JOIN public.turmas t ON a.turma_id = t.id
    WHERE t.escola_id = auth.uid()
  ) AND is_escola_user(auth.uid())
);

CREATE POLICY "Escolas podem deletar responsáveis"
ON public.aluno_responsaveis FOR DELETE
USING (
  aluno_id IN (
    SELECT a.id FROM public.alunos a
    JOIN public.turmas t ON a.turma_id = t.id
    WHERE t.escola_id = auth.uid()
  ) AND is_escola_user(auth.uid())
);

-- Políticas para pais: podem ver seus próprios vínculos
CREATE POLICY "Responsáveis podem ver seus vínculos"
ON public.aluno_responsaveis FOR SELECT
USING (responsavel_user_id = auth.uid() OR responsavel_email = auth.email());

CREATE POLICY "Responsáveis podem atualizar status"
ON public.aluno_responsaveis FOR UPDATE
USING (responsavel_user_id = auth.uid() OR responsavel_email = auth.email())
WITH CHECK (responsavel_user_id = auth.uid() OR responsavel_email = auth.email());

-- Criar tabela para check-ins emocionais dos alunos da escola
CREATE TABLE IF NOT EXISTS public.aluno_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  emocao TEXT NOT NULL,
  intensidade INTEGER CHECK (intensidade >= 1 AND intensidade <= 5),
  observacoes TEXT,
  data TIMESTAMP WITH TIME ZONE DEFAULT now(),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_aluno_checkins_aluno ON public.aluno_checkins(aluno_id);
CREATE INDEX idx_aluno_checkins_data ON public.aluno_checkins(data);

-- Habilitar RLS
ALTER TABLE public.aluno_checkins ENABLE ROW LEVEL SECURITY;

-- Políticas: Escolas podem ver check-ins de seus alunos
CREATE POLICY "Escolas podem ver checkins de seus alunos"
ON public.aluno_checkins FOR SELECT
USING (
  aluno_id IN (
    SELECT a.id FROM public.alunos a
    JOIN public.turmas t ON a.turma_id = t.id
    WHERE t.escola_id = auth.uid()
  ) AND is_escola_user(auth.uid())
);

CREATE POLICY "Escolas podem criar checkins"
ON public.aluno_checkins FOR INSERT
WITH CHECK (
  aluno_id IN (
    SELECT a.id FROM public.alunos a
    JOIN public.turmas t ON a.turma_id = t.id
    WHERE t.escola_id = auth.uid()
  ) AND is_escola_user(auth.uid())
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_aluno_responsaveis_updated_at
BEFORE UPDATE ON public.aluno_responsaveis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();