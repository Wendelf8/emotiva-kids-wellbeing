-- Let's check current policies and fix any issues
-- First, let's make sure the table has RLS enabled
ALTER TABLE public.criancas ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Permitir inserção de crianças próprias" ON public.criancas;
DROP POLICY IF EXISTS "Permitir visualização de crianças próprias" ON public.criancas;
DROP POLICY IF EXISTS "Permitir atualização de crianças próprias" ON public.criancas;
DROP POLICY IF EXISTS "Permitir exclusão de crianças próprias" ON public.criancas;

-- Create new clean policies with proper permissions
CREATE POLICY "allow_insert_own_children" 
ON public.criancas 
FOR INSERT 
TO authenticated
WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "allow_select_own_children" 
ON public.criancas 
FOR SELECT 
TO authenticated
USING (usuario_id = auth.uid());

CREATE POLICY "allow_update_own_children" 
ON public.criancas 
FOR UPDATE 
TO authenticated
USING (usuario_id = auth.uid()) 
WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "allow_delete_own_children" 
ON public.criancas 
FOR DELETE 
TO authenticated
USING (usuario_id = auth.uid());

-- Recreate the function to set usuario_id with better security
CREATE OR REPLACE FUNCTION public.set_usuario_id()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  NEW.usuario_id = auth.uid();
  RETURN NEW;
END;
$$;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS set_usuario_id_trigger ON public.criancas;

CREATE TRIGGER set_usuario_id_trigger
  BEFORE INSERT ON public.criancas
  FOR EACH ROW
  EXECUTE FUNCTION public.set_usuario_id();

-- Grant necessary permissions to authenticated users
GRANT INSERT, SELECT, UPDATE, DELETE ON public.criancas TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;