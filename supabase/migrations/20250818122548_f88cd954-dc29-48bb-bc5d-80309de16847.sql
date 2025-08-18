-- Criar função para forçar confirmação de usuários que estão com problemas
CREATE OR REPLACE FUNCTION public.force_confirm_user(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Atualizar usuário no auth para marcar como confirmado
  UPDATE auth.users 
  SET 
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    confirmed_at = COALESCE(confirmed_at, now())
  WHERE email = user_email;
END;
$$;

-- Limpar tokens de reset de senha expirados para reduzir rate limiting
DELETE FROM public.password_reset_tokens 
WHERE expires_at < now() OR used = true;

-- Criar função para verificar status de confirmação
CREATE OR REPLACE FUNCTION public.check_user_confirmation_status(user_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_info RECORD;
BEGIN
  SELECT 
    id,
    email,
    email_confirmed_at,
    confirmed_at,
    created_at
  INTO user_info
  FROM auth.users 
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'User not found');
  END IF;
  
  RETURN jsonb_build_object(
    'user_id', user_info.id,
    'email', user_info.email,
    'email_confirmed', user_info.email_confirmed_at IS NOT NULL,
    'confirmed', user_info.confirmed_at IS NOT NULL,
    'created_at', user_info.created_at
  );
END;
$$;