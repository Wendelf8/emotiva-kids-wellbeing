-- Security fix: Add search_path protection to all database functions
-- This prevents potential function hijacking attacks

-- Fix delete_user function
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    current_user_id uuid;
BEGIN
    -- Obter o ID do usuário autenticado
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    -- Deletar check-ins emocionais das crianças do usuário
    DELETE FROM public.checkins_emocionais 
    WHERE crianca_id IN (
        SELECT id FROM public.criancas 
        WHERE usuario_id = current_user_id
    );
    
    -- Deletar crianças do usuário
    DELETE FROM public.criancas 
    WHERE usuario_id = current_user_id;
    
    -- Deletar alertas do usuário
    DELETE FROM public.alertas 
    WHERE enviado_para_id = current_user_id;
    
    -- Deletar perfil do usuário
    DELETE FROM public.profiles 
    WHERE id = current_user_id;
    
    -- Deletar usuário do auth (isso deve ser feito por último)
    DELETE FROM auth.users 
    WHERE id = current_user_id;
END;
$$;

-- Fix set_usuario_id_for_criancas function
CREATE OR REPLACE FUNCTION public.set_usuario_id_for_criancas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.usuario_id = auth.uid();
  RETURN NEW;
END;
$$;

-- Fix set_usuario_id function
CREATE OR REPLACE FUNCTION public.set_usuario_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.usuario_id = auth.uid();
  RETURN NEW;
END;
$$;

-- Fix handle_new_user function
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