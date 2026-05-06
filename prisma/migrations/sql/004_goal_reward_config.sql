-- Goal: campos pra meta tiered + filtro mensal
-- Idempotente.

ALTER TABLE public."Goal"
  ADD COLUMN IF NOT EXISTS "rewardConfig" JSONB,
  ADD COLUMN IF NOT EXISTS "monthISO"     TEXT;

-- Backfill monthISO a partir do deadline pra registros existentes
UPDATE public."Goal"
SET "monthISO" = TO_CHAR("deadline", 'YYYY-MM')
WHERE "monthISO" IS NULL;

-- Índice pra filtro por período
CREATE INDEX IF NOT EXISTS "Goal_monthISO_idx"
  ON public."Goal" ("monthISO");
