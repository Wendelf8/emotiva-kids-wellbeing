-- Fix RLS policies for psicologos table to allow psychologists to read their own data
DROP POLICY IF EXISTS "Psicólogos podem ver seu próprio perfil" ON public.psicologos;
DROP POLICY IF EXISTS "Psicólogos podem inserir seu próprio perfil" ON public.psicologos;
DROP POLICY IF EXISTS "Psicólogos podem atualizar seu próprio perfil" ON public.psicologos;

-- Recreate SELECT policy with proper permissions
CREATE POLICY "Psicólogos podem ver seu próprio perfil"
ON public.psicologos
FOR SELECT
USING (user_id = auth.uid());

-- Recreate INSERT policy  
CREATE POLICY "Psicólogos podem inserir seu próprio perfil"
ON public.psicologos
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Recreate UPDATE policy
CREATE POLICY "Psicólogos podem atualizar seu próprio perfil"
ON public.psicologos
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());