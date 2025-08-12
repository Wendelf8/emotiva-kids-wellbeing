-- Primeiro, atualizar os dados existentes
UPDATE public.profiles 
SET tipo_usuario = 'Escola' 
WHERE tipo_usuario = 'escola';

-- Remover a constraint existente
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_tipo_usuario_check;

-- Criar nova constraint com os valores corretos
ALTER TABLE public.profiles ADD CONSTRAINT profiles_tipo_usuario_check 
CHECK (tipo_usuario = ANY (ARRAY['pai'::text, 'mae'::text, 'Escola'::text]));