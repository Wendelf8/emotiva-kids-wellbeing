-- Enable RLS on criancas table if not already enabled
ALTER TABLE public.criancas ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert their own children" ON public.criancas;
DROP POLICY IF EXISTS "Users can view their own children" ON public.criancas;
DROP POLICY IF EXISTS "Users can update their own children" ON public.criancas;
DROP POLICY IF EXISTS "Users can delete their own children" ON public.criancas;
DROP POLICY IF EXISTS "Usuário pode adicionar criança" ON public.criancas;
DROP POLICY IF EXISTS "Allow user to select their own child 1" ON public.criancas;
DROP POLICY IF EXISTS "Allow user to select their own child" ON public.criancas;
DROP POLICY IF EXISTS "Allow user to insert their own child" ON public.criancas;
DROP POLICY IF EXISTS "Allow user to update their own child" ON public.criancas;
DROP POLICY IF EXISTS "Allow user to delete their own child" ON public.criancas;
DROP POLICY IF EXISTS "Pode inserir criança se for o dono" ON public.criancas;
DROP POLICY IF EXISTS "Pode ver criança se for o dono" ON public.criancas;
DROP POLICY IF EXISTS "Pode atualizar criança se for o dono" ON public.criancas;
DROP POLICY IF EXISTS "Pode deletar criança se for o dono" ON public.criancas;

-- Create new clean policies
CREATE POLICY "Permitir inserção de crianças próprias" 
ON public.criancas 
FOR INSERT 
WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Permitir visualização de crianças próprias" 
ON public.criancas 
FOR SELECT 
USING (usuario_id = auth.uid());

CREATE POLICY "Permitir atualização de crianças próprias" 
ON public.criancas 
FOR UPDATE 
USING (usuario_id = auth.uid()) 
WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Permitir exclusão de crianças próprias" 
ON public.criancas 
FOR DELETE 
USING (usuario_id = auth.uid());

-- Create function to automatically set usuario_id
CREATE OR REPLACE FUNCTION public.set_usuario_id_for_criancas()
RETURNS TRIGGER AS $$
BEGIN
  NEW.usuario_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_set_usuario_id_criancas ON public.criancas;

-- Create trigger to automatically set usuario_id on insert
CREATE TRIGGER trigger_set_usuario_id_criancas
  BEFORE INSERT ON public.criancas
  FOR EACH ROW
  EXECUTE FUNCTION public.set_usuario_id_for_criancas();