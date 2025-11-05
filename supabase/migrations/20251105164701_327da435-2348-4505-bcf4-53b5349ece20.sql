-- Create helper function to avoid RLS cross-table permission errors
CREATE OR REPLACE FUNCTION public.is_child_shared_with_current_psych(_child_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.shared_reports sr
    JOIN public.psicologos p ON p.id = sr.psychologist_id
    WHERE sr.child_id = _child_id
      AND sr.status = 'aceito'
      AND p.user_id = auth.uid()
  );
$$;

-- Update policies on criancas: replace psychologist SELECT policy to use function
DROP POLICY IF EXISTS "Psicólogos podem ver crianças compartilhadas aceitas" ON public.criancas;
CREATE POLICY "Psicólogos podem ver crianças compartilhadas aceitas"
ON public.criancas
FOR SELECT
USING (public.is_child_shared_with_current_psych(id));

-- Update policies on checkins_emocionais: replace psychologist SELECT policy to use function
DROP POLICY IF EXISTS "Psicólogos podem ver check-ins de crianças compartilhadas ace" ON public.checkins_emocionais;
CREATE POLICY "Psicólogos podem ver check-ins de crianças compartilhadas ace"
ON public.checkins_emocionais
FOR SELECT
USING (public.is_child_shared_with_current_psych(crianca_id));

-- Fix alertas policy causing cross-table access; duplicates already allow own alerts
DROP POLICY IF EXISTS "Psicólogos podem ver alertas enviados para eles" ON public.alertas;
-- (Other policies remain: 'Usuário vê seus alertas' / 'Ver alertas enviados para si')
