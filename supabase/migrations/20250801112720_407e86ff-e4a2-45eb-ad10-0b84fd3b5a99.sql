-- Primeiro, vamos ajustar a tabela de checkins_emocionais para ter os campos corretos
-- Se não existir, vamos criar uma nova tabela 'checkins' como especificado

-- Criar a tabela checkins com a estrutura correta
CREATE TABLE IF NOT EXISTS public.checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL,
  child_id UUID NOT NULL REFERENCES public.criancas(id) ON DELETE CASCADE,
  emocao TEXT NOT NULL,
  dormiu_bem BOOLEAN,
  aconteceu_algo_ruim BOOLEAN,
  comentario TEXT,
  data_checkin TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "allow_insert_own_checkins" 
ON public.checkins 
FOR INSERT 
TO authenticated
WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "allow_select_own_checkins" 
ON public.checkins 
FOR SELECT 
TO authenticated
USING (usuario_id = auth.uid());

CREATE POLICY "allow_update_own_checkins" 
ON public.checkins 
FOR UPDATE 
TO authenticated
USING (usuario_id = auth.uid()) 
WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "allow_delete_own_checkins" 
ON public.checkins 
FOR DELETE 
TO authenticated
USING (usuario_id = auth.uid());

-- Criar função para preencher usuario_id automaticamente
CREATE OR REPLACE FUNCTION public.set_usuario_id_for_checkins()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  NEW.usuario_id = auth.uid();
  RETURN NEW;
END;
$$;

-- Criar trigger para preencher usuario_id automaticamente
DROP TRIGGER IF EXISTS set_usuario_id_trigger_checkins ON public.checkins;

CREATE TRIGGER set_usuario_id_trigger_checkins
  BEFORE INSERT ON public.checkins
  FOR EACH ROW
  EXECUTE FUNCTION public.set_usuario_id_for_checkins();

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_checkins_usuario_id ON public.checkins(usuario_id);
CREATE INDEX IF NOT EXISTS idx_checkins_child_id ON public.checkins(child_id);
CREATE INDEX IF NOT EXISTS idx_checkins_data_checkin ON public.checkins(data_checkin);

-- Criar constraint para garantir um check-in por criança por dia
CREATE UNIQUE INDEX IF NOT EXISTS idx_checkins_unique_child_date 
ON public.checkins(child_id, DATE(data_checkin));

-- Grant permissions
GRANT INSERT, SELECT, UPDATE, DELETE ON public.checkins TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;