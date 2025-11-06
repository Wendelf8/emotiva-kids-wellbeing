-- Ensure psicologo_id is generated and unique, and backfill existing rows
-- 1) Backfill missing psicologo_id values sequentially to avoid duplicates
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT id FROM public.psicologos WHERE psicologo_id IS NULL OR psicologo_id = '' LOOP
    UPDATE public.psicologos
    SET psicologo_id = public.generate_psicologo_id()
    WHERE id = rec.id;
  END LOOP;
END $$;

-- 2) Add a unique constraint to guarantee uniqueness going forward
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'psicologos_psicologo_id_key'
  ) THEN
    ALTER TABLE public.psicologos
    ADD CONSTRAINT psicologos_psicologo_id_key UNIQUE (psicologo_id);
  END IF;
END $$;

-- 3) Create trigger to auto-generate psicologo_id on insert when not provided
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_psicologo_id_trigger'
  ) THEN
    CREATE TRIGGER set_psicologo_id_trigger
    BEFORE INSERT ON public.psicologos
    FOR EACH ROW
    EXECUTE FUNCTION public.set_psicologo_id();
  END IF;
END $$;