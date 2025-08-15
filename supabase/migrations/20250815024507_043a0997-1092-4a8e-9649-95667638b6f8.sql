-- Primeiro, vamos remover qualquer constraint que esteja bloqueando a atualização
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_tipo_usuario_check;

-- Normalizar os dados existentes
UPDATE public.profiles 
SET tipo_usuario = LOWER(TRIM(tipo_usuario)) 
WHERE tipo_usuario IS NOT NULL;

-- Corrigir as políticas RLS para usar LOWER(TRIM()) na comparação
DROP POLICY IF EXISTS "Escolas podem criar turmas" ON public.turmas;
CREATE POLICY "Escolas podem criar turmas"
ON public.turmas
FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid() AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND LOWER(TRIM(tipo_usuario)) = 'escola'
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
        WHERE id = auth.uid() AND LOWER(TRIM(tipo_usuario)) = 'escola'
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
        WHERE id = auth.uid() AND LOWER(TRIM(tipo_usuario)) = 'escola'
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
        WHERE id = auth.uid() AND LOWER(TRIM(tipo_usuario)) = 'escola'
    )
);

-- Remover política duplicada se existir
DROP POLICY IF EXISTS "Somente escolas podem criar turmas" ON public.turmas;

-- Adicionar trigger para normalizar automaticamente futuros inserts/updates
CREATE OR REPLACE FUNCTION normalize_tipo_usuario()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.tipo_usuario IS NOT NULL THEN
        NEW.tipo_usuario = LOWER(TRIM(NEW.tipo_usuario));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS normalize_tipo_usuario_trigger ON public.profiles;
CREATE TRIGGER normalize_tipo_usuario_trigger
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION normalize_tipo_usuario();