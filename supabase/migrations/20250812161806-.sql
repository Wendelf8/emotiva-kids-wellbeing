-- Corrigir dados específicos: mudar 'escola' para 'Escola'
UPDATE public.profiles 
SET tipo_usuario = 'Escola' 
WHERE tipo_usuario = 'escola';

-- Agora adicionar a constraint com os valores corretos
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_tipo_usuario_check 
CHECK (tipo_usuario = ANY (ARRAY['pai'::text, 'mae'::text, 'Escola'::text]));