-- Configurar Site URL e Redirect URLs para resolver problemas de confirmação de email
-- Primeiro, verificamos se há algum problema com as configurações de auth

-- Atualizar configurações de auth para resolver problemas de confirmação
UPDATE auth.config 
SET 
  site_url = 'https://98dcc365-468c-4116-ae2b-38b05e2aef7c.lovableproject.com',
  uri_allow_list = 'https://98dcc365-468c-4116-ae2b-38b05e2aef7c.lovableproject.com/*'
WHERE true;

-- Criar uma função para verificar e confirmar usuários manualmente se necessário
CREATE OR REPLACE FUNCTION public.force_confirm_user(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE auth.users 
  SET 
    email_confirmed_at = now(),
    confirmed_at = now()
  WHERE email = user_email 
  AND email_confirmed_at IS NULL;
END;
$$;

-- Limpar tokens de reset de senha expirados para reduzir rate limiting
DELETE FROM public.password_reset_tokens 
WHERE expires_at < now() OR used = true;