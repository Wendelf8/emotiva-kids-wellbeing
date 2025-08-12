-- Ajustar a função usada pelas RLS para ser case-insensitive e segura
CREATE OR REPLACE FUNCTION public.is_escola_user(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND lower(tipo_usuario) = 'escola'
  );
$$;