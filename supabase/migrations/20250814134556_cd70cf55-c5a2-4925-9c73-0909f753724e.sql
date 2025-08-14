-- Primeiro, adicionar a coluna user_id se ela não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' 
        AND table_name='turmas' 
        AND column_name='user_id'
    ) THEN
        -- Adicionar a coluna
        ALTER TABLE public.turmas ADD COLUMN user_id uuid;

        -- Copiar valores de escola_id para a nova coluna user_id (se necessário)
        UPDATE public.turmas SET user_id = escola_id;

        -- Tornar a coluna NOT NULL se for o caso
        ALTER TABLE public.turmas ALTER COLUMN user_id SET NOT NULL;
    END IF;
END
$$;

-- Agora, aplicar as políticas RLS corrigidas
-- Políticas para public.turmas
DROP POLICY IF EXISTS "Escolas podem criar turmas" ON public.turmas;
CREATE POLICY "Escolas podem criar turmas"
ON public.turmas
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND LOWER(tipo_usuario) = 'escola'
    )
);

DROP POLICY IF EXISTS "Escolas podem ver suas turmas" ON public.turmas;
CREATE POLICY "Escolas podem ver suas turmas"
ON public.turmas
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND LOWER(tipo_usuario) = 'escola'
    )
);

DROP POLICY IF EXISTS "Escolas podem atualizar suas turmas" ON public.turmas;
CREATE POLICY "Escolas podem atualizar suas turmas"
ON public.turmas
FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid() AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND LOWER(tipo_usuario) = 'escola'
    )
);

DROP POLICY IF EXISTS "Escolas podem deletar suas turmas" ON public.turmas;
CREATE POLICY "Escolas podem deletar suas turmas"
ON public.turmas
FOR DELETE
TO authenticated
USING (
    user_id = auth.uid() AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND LOWER(tipo_usuario) = 'escola'
    )
);

-- Remover políticas antigas conflitantes
DROP POLICY IF EXISTS "Escola users can manage their turmas" ON public.turmas;
DROP POLICY IF EXISTS "Users can view turmas they have access to" ON public.turmas;