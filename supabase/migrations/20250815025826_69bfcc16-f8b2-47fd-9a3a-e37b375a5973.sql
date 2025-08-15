-- Update RLS policies to handle both 'escola' and 'Escola' case variations
DROP POLICY IF EXISTS "Escolas podem criar turmas" ON public.turmas;
DROP POLICY IF EXISTS "Escolas podem ver suas turmas" ON public.turmas;
DROP POLICY IF EXISTS "Escolas podem atualizar suas turmas" ON public.turmas;
DROP POLICY IF EXISTS "Escolas podem deletar suas turmas" ON public.turmas;

-- Create new policies that work with both cases
CREATE POLICY "Escolas podem criar turmas" ON public.turmas
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND (LOWER(TRIM(tipo_usuario)) = 'escola' OR tipo_usuario IN ('escola', 'Escola'))
  )
);

CREATE POLICY "Escolas podem ver suas turmas" ON public.turmas
FOR SELECT 
USING (
  user_id = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND (LOWER(TRIM(tipo_usuario)) = 'escola' OR tipo_usuario IN ('escola', 'Escola'))
  )
);

CREATE POLICY "Escolas podem atualizar suas turmas" ON public.turmas
FOR UPDATE 
USING (
  user_id = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND (LOWER(TRIM(tipo_usuario)) = 'escola' OR tipo_usuario IN ('escola', 'Escola'))
  )
);

CREATE POLICY "Escolas podem deletar suas turmas" ON public.turmas
FOR DELETE 
USING (
  user_id = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND (LOWER(TRIM(tipo_usuario)) = 'escola' OR tipo_usuario IN ('escola', 'Escola'))
  )
);

-- Ensure existing users with 'Escola' get normalized to 'escola'
UPDATE public.profiles 
SET tipo_usuario = 'escola' 
WHERE tipo_usuario = 'Escola';