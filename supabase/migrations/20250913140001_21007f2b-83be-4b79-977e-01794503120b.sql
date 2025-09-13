-- Corrigir funções sem search_path definido adequadamente
-- Atualizar função generate_psicologo_id
CREATE OR REPLACE FUNCTION public.generate_psicologo_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id TEXT;
  counter INTEGER := 1;
BEGIN
  LOOP
    new_id := 'PSIC-' || LPAD(counter::TEXT, 4, '0');
    
    IF NOT EXISTS (SELECT 1 FROM public.psicologos WHERE psicologo_id = new_id) THEN
      RETURN new_id;
    END IF;
    
    counter := counter + 1;
  END LOOP;
END;
$$;

-- Atualizar função set_psicologo_id  
CREATE OR REPLACE FUNCTION public.set_psicologo_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.psicologo_id IS NULL OR NEW.psicologo_id = '' THEN
    NEW.psicologo_id := generate_psicologo_id();
  END IF;
  RETURN NEW;
END;
$$;

-- Atualizar função update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Atualizar função handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Atualizar função set_usuario_id
CREATE OR REPLACE FUNCTION public.set_usuario_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.usuario_id = auth.uid();
  RETURN NEW;
END;
$$;

-- Atualizar função set_usuario_id_for_criancas
CREATE OR REPLACE FUNCTION public.set_usuario_id_for_criancas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.usuario_id = auth.uid();
  RETURN NEW;
END;
$$;

-- Atualizar função normalize_tipo_usuario
CREATE OR REPLACE FUNCTION public.normalize_tipo_usuario()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.tipo_usuario IS NOT NULL THEN
        NEW.tipo_usuario = LOWER(TRIM(NEW.tipo_usuario));
    END IF;
    RETURN NEW;
END;
$$;

-- Atualizar função is_escola_user
CREATE OR REPLACE FUNCTION public.is_escola_user(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND tipo_usuario = 'Escola'
  );
$$;

-- Atualizar função delete_user
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Atualizar função cleanup_expired_reset_tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_reset_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.password_reset_tokens 
  WHERE expires_at < NOW() OR used = true;
END;
$$;