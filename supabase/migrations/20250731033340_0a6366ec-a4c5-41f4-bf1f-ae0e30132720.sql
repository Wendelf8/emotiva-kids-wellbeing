-- First, let's clean all existing policies completely
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'criancas'
    LOOP
        EXECUTE format('DROP POLICY %I ON public.criancas', policy_record.policyname);
    END LOOP;
END $$;

-- Now create the new clean policies
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