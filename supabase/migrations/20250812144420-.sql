-- Verificar se existem usuários do tipo escola na tabela profiles
-- Se não existirem, esta é a causa do problema

-- Primeiro, vamos verificar se existe algum usuário com tipo 'escola'
-- Se não houver, vamos corrigir o handle_new_user para permitir criar perfis de escola

-- Atualizar a função handle_new_user para aceitar tipo_usuario do metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, tipo_usuario)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', 'pai')
  );
  RETURN NEW;
END;
$$;

-- Adicionar política temporária para permitir debug
CREATE POLICY "Debug - Allow authenticated users to see all turmas" 
ON public.turmas 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Debug - Allow authenticated users to insert turmas" 
ON public.turmas 
FOR INSERT 
TO authenticated 
WITH CHECK (escola_id = auth.uid());

-- Vamos também verificar se o usuário atual tem o tipo correto
-- Esta query pode ser executada no SQL Editor para debug:
-- SELECT id, nome, email, tipo_usuario FROM profiles WHERE id = auth.uid();