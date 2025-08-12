-- Primeiro, remover a constraint existente
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_tipo_usuario_check;

-- Depois, corrigir os dados
UPDATE public.profiles
SET tipo_usuario = 'Escola'
WHERE tipo_usuario = 'escola';

-- Por fim, criar a nova constraint de forma mais simples e robusta
ALTER TABLE public.profiles ADD CONSTRAINT profiles_tipo_usuario_check CHECK (tipo_usuario IN ('pai', 'mae', 'Escola'));