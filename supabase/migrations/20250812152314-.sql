-- Remover políticas de debug e corrigir as principais

-- Dropar políticas debug temporárias
DROP POLICY IF EXISTS "Debug - Allow authenticated users to see all turmas" ON public.turmas;
DROP POLICY IF EXISTS "Debug - Allow authenticated users to insert turmas" ON public.turmas;

-- Criar função para verificar se usuário é escola (evita recursão)
CREATE OR REPLACE FUNCTION public.is_escola_user(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND tipo_usuario = 'escola'
  );
$$;

-- Recriar políticas usando a função
DROP POLICY IF EXISTS "Escolas podem ver suas turmas" ON public.turmas;
DROP POLICY IF EXISTS "Escolas podem criar turmas" ON public.turmas;
DROP POLICY IF EXISTS "Escolas podem atualizar suas turmas" ON public.turmas;
DROP POLICY IF EXISTS "Escolas podem deletar suas turmas" ON public.turmas;

-- Políticas corretas para turmas
CREATE POLICY "Escolas podem ver suas turmas" 
ON public.turmas 
FOR SELECT 
TO authenticated
USING (escola_id = auth.uid() AND public.is_escola_user(auth.uid()));

CREATE POLICY "Escolas podem criar turmas" 
ON public.turmas 
FOR INSERT 
TO authenticated
WITH CHECK (escola_id = auth.uid() AND public.is_escola_user(auth.uid()));

CREATE POLICY "Escolas podem atualizar suas turmas" 
ON public.turmas 
FOR UPDATE 
TO authenticated
USING (escola_id = auth.uid() AND public.is_escola_user(auth.uid()));

CREATE POLICY "Escolas podem deletar suas turmas" 
ON public.turmas 
FOR DELETE 
TO authenticated
USING (escola_id = auth.uid() AND public.is_escola_user(auth.uid()));

-- Atualizar também políticas de alunos para usar a função
DROP POLICY IF EXISTS "Escolas podem ver alunos de suas turmas" ON public.alunos;
DROP POLICY IF EXISTS "Escolas podem criar alunos em suas turmas" ON public.alunos;
DROP POLICY IF EXISTS "Escolas podem atualizar alunos de suas turmas" ON public.alunos;
DROP POLICY IF EXISTS "Escolas podem deletar alunos de suas turmas" ON public.alunos;

CREATE POLICY "Escolas podem ver alunos de suas turmas" 
ON public.alunos 
FOR SELECT 
TO authenticated
USING (
  turma_id IN (
    SELECT id FROM public.turmas 
    WHERE escola_id = auth.uid()
  ) AND public.is_escola_user(auth.uid())
);

CREATE POLICY "Escolas podem criar alunos em suas turmas" 
ON public.alunos 
FOR INSERT 
TO authenticated
WITH CHECK (
  turma_id IN (
    SELECT id FROM public.turmas 
    WHERE escola_id = auth.uid()
  ) AND public.is_escola_user(auth.uid())
);

CREATE POLICY "Escolas podem atualizar alunos de suas turmas" 
ON public.alunos 
FOR UPDATE 
TO authenticated
USING (
  turma_id IN (
    SELECT id FROM public.turmas 
    WHERE escola_id = auth.uid()
  ) AND public.is_escola_user(auth.uid())
);

CREATE POLICY "Escolas podem deletar alunos de suas turmas" 
ON public.alunos 
FOR DELETE 
TO authenticated
USING (
  turma_id IN (
    SELECT id FROM public.turmas 
    WHERE escola_id = auth.uid()
  ) AND public.is_escola_user(auth.uid())
);