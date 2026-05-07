-- Goal scope (Permanente / Mensal / Anual) + yearISO
-- Idempotente. Pré-requisito: 004_goal_reward_config.sql já aplicado
-- (rewardConfig, monthISO).
--
-- Lógica de uso (src/lib/goals.ts → resolveGoalsForPeriod):
-- - PERMANENT: vale como padrão pra todo período do colaborador.
-- - MONTHLY:   substitui a permanente APENAS no monthISO selecionado.
-- - YEARLY:    substitui a permanente APENAS no yearISO selecionado.

-- ── enum GoalScope ──────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GoalScope') THEN
    CREATE TYPE "GoalScope" AS ENUM ('PERMANENT', 'MONTHLY', 'YEARLY');
  END IF;
END$$;

-- ── colunas em Goal ─────────────────────────────────────────────────────
ALTER TABLE public."Goal"
  ADD COLUMN IF NOT EXISTS "scope"   "GoalScope" NOT NULL DEFAULT 'MONTHLY',
  ADD COLUMN IF NOT EXISTS "yearISO" TEXT;

-- Backfill: metas legadas com monthISO setado ficam MONTHLY (já é o
-- default). Sem ação necessária — comentado pra documentar a intenção.
-- UPDATE public."Goal" SET "scope" = 'MONTHLY' WHERE "monthISO" IS NOT NULL;

-- ── índices pra filtro por período ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS "Goal_yearISO_idx"
  ON public."Goal" ("yearISO");

CREATE INDEX IF NOT EXISTS "Goal_ownerId_scope_idx"
  ON public."Goal" ("ownerId", "scope");
