-- Criar tabela para tokens de redefinição de senha
CREATE TABLE public.password_reset_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token UUID NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_expires_at ON public.password_reset_tokens(expires_at);

-- RLS policies
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Apenas administradores podem acessar esta tabela (será usada via service role)
CREATE POLICY "Service role can manage password reset tokens" 
ON public.password_reset_tokens 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Função para limpar tokens expirados (cleanup automático)
CREATE OR REPLACE FUNCTION public.cleanup_expired_reset_tokens()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.password_reset_tokens 
  WHERE expires_at < NOW() OR used = true;
END;
$$;