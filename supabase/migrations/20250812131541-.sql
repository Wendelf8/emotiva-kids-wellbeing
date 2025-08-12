-- Função para deletar conta do usuário e todos os dados relacionados
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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