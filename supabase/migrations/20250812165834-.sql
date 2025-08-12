-- Enable RLS on turmas table
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;

-- Create policy for Escola users to manage their turmas
CREATE POLICY "Escola users can manage their turmas" 
ON public.turmas 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.tipo_usuario = 'Escola'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.tipo_usuario = 'Escola'
  )
);

-- Create policy for read access to turmas (if needed for other user types)
CREATE POLICY "Users can view turmas they have access to" 
ON public.turmas 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid()
  )
);