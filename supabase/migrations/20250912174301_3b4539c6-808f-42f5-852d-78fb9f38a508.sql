-- Adicionar tabela de psicólogos
CREATE TABLE public.psicologos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  crp TEXT NOT NULL UNIQUE,
  especialidade TEXT NOT NULL,
  celular TEXT NOT NULL,
  psicologo_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.psicologos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para psicólogos
CREATE POLICY "Psicólogos podem ver seu próprio perfil"
ON public.psicologos
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Psicólogos podem inserir seu próprio perfil"
ON public.psicologos
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Psicólogos podem atualizar seu próprio perfil"
ON public.psicologos
FOR UPDATE
USING (user_id = auth.uid());

-- Criar tabela de relatórios compartilhados
CREATE TABLE public.shared_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.criancas(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL,
  psychologist_id UUID NOT NULL REFERENCES public.psicologos(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aceito', 'revogado')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.shared_reports ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para shared_reports
CREATE POLICY "Pais podem ver relatórios de suas crianças"
ON public.shared_reports
FOR SELECT
USING (parent_id = auth.uid());

CREATE POLICY "Psicólogos podem ver relatórios compartilhados com eles"
ON public.shared_reports
FOR SELECT
USING (psychologist_id IN (SELECT id FROM public.psicologos WHERE user_id = auth.uid()));

CREATE POLICY "Pais podem criar compartilhamentos"
ON public.shared_reports
FOR INSERT
WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Pais podem atualizar status dos compartilhamentos"
ON public.shared_reports
FOR UPDATE
USING (parent_id = auth.uid());

CREATE POLICY "Psicólogos podem atualizar status dos compartilhamentos"
ON public.shared_reports
FOR UPDATE
USING (psychologist_id IN (SELECT id FROM public.psicologos WHERE user_id = auth.uid()));

-- Função para gerar ID do psicólogo
CREATE OR REPLACE FUNCTION generate_psicologo_id()
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql;

-- Trigger para gerar ID automaticamente
CREATE OR REPLACE FUNCTION set_psicologo_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.psicologo_id IS NULL OR NEW.psicologo_id = '' THEN
    NEW.psicologo_id := generate_psicologo_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_psicologo_id
  BEFORE INSERT ON public.psicologos
  FOR EACH ROW
  EXECUTE FUNCTION set_psicologo_id();

-- Atualizar tabela profiles para incluir tipo de usuário
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'parent' CHECK (user_type IN ('parent', 'psychologist'));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_psicologos_updated_at
  BEFORE UPDATE ON public.psicologos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shared_reports_updated_at
  BEFORE UPDATE ON public.shared_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();