-- Atualizar a função is_escola_user para verificar o valor correto "Escola"
CREATE OR REPLACE FUNCTION public.is_escola_user(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND tipo_usuario = 'Escola'
  );
$$;