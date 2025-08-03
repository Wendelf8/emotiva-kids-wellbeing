-- Atualizar estrutura da tabela checkins_emocionais para incluir todos os campos necessários
ALTER TABLE public.checkins_emocionais 
ADD COLUMN IF NOT EXISTS data_escolhida date,
ADD COLUMN IF NOT EXISTS como_se_sente text,
ADD COLUMN IF NOT EXISTS dormiu_bem boolean,
ADD COLUMN IF NOT EXISTS algo_ruim boolean,
ADD COLUMN IF NOT EXISTS resumo text,
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

-- Migrar dados existentes se houver
UPDATE public.checkins_emocionais 
SET como_se_sente = emocao,
    data_escolhida = data::date,
    created_at = COALESCE(created_at, data)
WHERE como_se_sente IS NULL;

-- Adicionar constraint para um check-in por criança por dia
ALTER TABLE public.checkins_emocionais 
ADD CONSTRAINT unique_checkin_per_day 
UNIQUE (crianca_id, data_escolhida);

-- Atualizar índices
DROP INDEX IF EXISTS idx_checkins_emocionais_crianca_data;
CREATE INDEX idx_checkins_emocionais_crianca_data_escolhida 
ON public.checkins_emocionais (crianca_id, data_escolhida);

CREATE INDEX idx_checkins_emocionais_created_at 
ON public.checkins_emocionais (created_at);