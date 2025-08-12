-- Corrigir dados existentes: atualizar tipo_usuario de "escola" para "Escola"
UPDATE public.profiles 
SET tipo_usuario = 'Escola' 
WHERE tipo_usuario = 'escola';

-- Verificar se a função is_escola_user está funcionando corretamente
-- Testar com usuário atual logado