-- Fix the security issue: Restore restrictive RLS policy and make is_escola_user function work properly
-- First, restore the proper RLS policy that only allows users to see their own profile
ALTER POLICY "View own profile" ON public.profiles USING (auth.uid() = id);

-- Then, update the is_escola_user function to use SECURITY DEFINER 
-- This allows it to bypass RLS for its specific check while keeping the table secure
CREATE OR REPLACE FUNCTION public.is_escola_user(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND tipo_usuario = 'Escola'
  );
$$;