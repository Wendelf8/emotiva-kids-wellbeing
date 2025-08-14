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

-- Remover políticas antigas que podem estar conflitando
DROP POLICY IF EXISTS "Escola users can manage their turmas" ON public.turmas;
DROP POLICY IF EXISTS "Users can view turmas they have access to" ON public.turmas;