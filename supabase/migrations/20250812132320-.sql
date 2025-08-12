-- Criar tabela de turmas
CREATE TABLE public.turmas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    serie TEXT,
    descricao TEXT,
    escola_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de alunos
CREATE TABLE public.alunos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    idade INTEGER NOT NULL,
    responsavel TEXT,
    turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para turmas (apenas escolas podem ver/gerenciar suas turmas)
CREATE POLICY "Escolas podem ver suas turmas" 
ON public.turmas 
FOR SELECT 
USING (
    escola_id = auth.uid() AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND tipo_usuario = 'escola'
    )
);

CREATE POLICY "Escolas podem criar turmas" 
ON public.turmas 
FOR INSERT 
WITH CHECK (
    escola_id = auth.uid() AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND tipo_usuario = 'escola'
    )
);

CREATE POLICY "Escolas podem atualizar suas turmas" 
ON public.turmas 
FOR UPDATE 
USING (
    escola_id = auth.uid() AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND tipo_usuario = 'escola'
    )
);

CREATE POLICY "Escolas podem deletar suas turmas" 
ON public.turmas 
FOR DELETE 
USING (
    escola_id = auth.uid() AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND tipo_usuario = 'escola'
    )
);

-- Políticas RLS para alunos (apenas escolas podem ver/gerenciar alunos de suas turmas)
CREATE POLICY "Escolas podem ver alunos de suas turmas" 
ON public.alunos 
FOR SELECT 
USING (
    turma_id IN (
        SELECT id FROM public.turmas 
        WHERE escola_id = auth.uid()
    ) AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND tipo_usuario = 'escola'
    )
);

CREATE POLICY "Escolas podem criar alunos em suas turmas" 
ON public.alunos 
FOR INSERT 
WITH CHECK (
    turma_id IN (
        SELECT id FROM public.turmas 
        WHERE escola_id = auth.uid()
    ) AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND tipo_usuario = 'escola'
    )
);

CREATE POLICY "Escolas podem atualizar alunos de suas turmas" 
ON public.alunos 
FOR UPDATE 
USING (
    turma_id IN (
        SELECT id FROM public.turmas 
        WHERE escola_id = auth.uid()
    ) AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND tipo_usuario = 'escola'
    )
);

CREATE POLICY "Escolas podem deletar alunos de suas turmas" 
ON public.alunos 
FOR DELETE 
USING (
    turma_id IN (
        SELECT id FROM public.turmas 
        WHERE escola_id = auth.uid()
    ) AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND tipo_usuario = 'escola'
    )
);