-- Atualizar políticas RLS para alertas para incluir psicólogos
DROP POLICY IF EXISTS "Psicólogos podem ver alertas enviados para eles" ON public.alertas;

CREATE POLICY "Psicólogos podem ver alertas enviados para eles"
ON public.alertas
FOR SELECT
USING (
  enviado_para_id IN (
    SELECT user_id FROM public.psicologos WHERE user_id = auth.uid()
  ) OR
  enviado_para_id = auth.uid()
);

-- Política para permitir que psicólogos vejam dados de crianças com compartilhamento aceito
CREATE POLICY "Psicólogos podem ver crianças compartilhadas aceitas"
ON public.criancas
FOR SELECT
USING (
  id IN (
    SELECT child_id 
    FROM public.shared_reports sr
    JOIN public.psicologos p ON p.id = sr.psychologist_id
    WHERE p.user_id = auth.uid() AND sr.status = 'aceito'
  )
);

-- Política para permitir que psicólogos vejam check-ins de crianças compartilhadas aceitas
CREATE POLICY "Psicólogos podem ver check-ins de crianças compartilhadas aceitas"
ON public.checkins_emocionais
FOR SELECT
USING (
  crianca_id IN (
    SELECT child_id 
    FROM public.shared_reports sr
    JOIN public.psicologos p ON p.id = sr.psychologist_id
    WHERE p.user_id = auth.uid() AND sr.status = 'aceito'
  )
);

-- Atualizar política de visualização de shared_reports para incluir busca por ID do psicólogo
DROP POLICY IF EXISTS "Usuários podem ver shared_reports pelo ID do psicólogo" ON public.shared_reports;

CREATE POLICY "Usuários podem ver shared_reports pelo ID do psicólogo"
ON public.shared_reports
FOR SELECT
USING (
  -- Pais podem ver seus próprios compartilhamentos
  parent_id = auth.uid() OR
  -- Psicólogos podem ver compartilhamentos feitos com eles
  psychologist_id IN (
    SELECT id FROM public.psicologos WHERE user_id = auth.uid()
  ) OR
  -- Permitir busca por psicologo_id para validação
  psychologist_id IN (
    SELECT id FROM public.psicologos WHERE psicologo_id = ANY(
      SELECT unnest(string_to_array(current_setting('request.jwt.claims', true)::json->>'search_psic_id', ','))
    )
  )
);

-- Política para inserção de shared_reports
CREATE POLICY "Pais podem criar compartilhamentos para suas crianças"
ON public.shared_reports
FOR INSERT
WITH CHECK (
  parent_id = auth.uid() AND
  child_id IN (
    SELECT id FROM public.criancas WHERE usuario_id = auth.uid()
  )
);