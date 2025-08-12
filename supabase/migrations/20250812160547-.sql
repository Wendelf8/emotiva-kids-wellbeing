-- Remover a constraint existente que não permite "Escola"
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_tipo_usuario_check;

-- Criar nova constraint que aceita os valores corretos incluindo "Escola"
ALTER TABLE public.profiles ADD CONSTRAINT profiles_tipo_usuario_check 
CHECK (tipo_usuario = ANY (ARRAY['pai'::text, 'mae'::text, 'Escola'::text]));

-- Atualizar dados existentes: corrigir "escola" para "Escola"
UPDATE public.profiles 
SET tipo_usuario = 'Escola' 
WHERE tipo_usuario = 'escola';