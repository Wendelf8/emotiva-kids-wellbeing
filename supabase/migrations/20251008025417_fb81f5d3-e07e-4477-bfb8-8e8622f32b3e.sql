-- Fix critical security issues identified in security review

-- 1. Fix alertas table - Remove overly permissive INSERT policy
-- Drop the unrestricted policy
DROP POLICY IF EXISTS "Sistema insere alertas" ON public.alertas;

-- Create a more restrictive policy that only allows edge functions with service role
-- For user-to-user notifications, we'll need to add this through edge functions
-- Users should not be able to directly insert alerts
CREATE POLICY "Only service role can insert alertas" 
ON public.alertas 
FOR INSERT 
WITH CHECK (false);

-- 2. Fix escolas table - Add ownership verification
-- First, check if user_id column exists, if not we need to add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'escolas' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.escolas ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Drop old policies
DROP POLICY IF EXISTS "Escola acessa seus dados" ON public.escolas;
DROP POLICY IF EXISTS "Escolas veem seus dados" ON public.escolas;

-- Create secure policy with ownership check
CREATE POLICY "Escolas podem ver apenas seus próprios dados" 
ON public.escolas 
FOR SELECT 
USING (
  user_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND LOWER(TRIM(tipo_usuario)) = 'escola'
  )
);

-- Allow escolas to insert their own data
CREATE POLICY "Escolas podem inserir seus próprios dados" 
ON public.escolas 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND LOWER(TRIM(tipo_usuario)) = 'escola'
  )
);

-- Allow escolas to update their own data
CREATE POLICY "Escolas podem atualizar seus próprios dados" 
ON public.escolas 
FOR UPDATE 
USING (
  user_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND LOWER(TRIM(tipo_usuario)) = 'escola'
  )
);

-- 3. Restrict force_confirm_user function - Drop it as it's too dangerous
-- If email confirmation bypass is needed, it should be done through Supabase dashboard
DROP FUNCTION IF EXISTS public.force_confirm_user(text);

-- 4. Add trigger to set user_id on escolas table insert
CREATE OR REPLACE FUNCTION public.set_user_id_for_escolas()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_user_id_on_escolas_insert ON public.escolas;

CREATE TRIGGER set_user_id_on_escolas_insert
  BEFORE INSERT ON public.escolas
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id_for_escolas();