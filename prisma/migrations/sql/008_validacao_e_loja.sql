-- ════════════════════════════════════════════════════════════════════════
-- 008 · VALIDAÇÃO DE AÇÕES + LOJA DE GIFT CARDS
-- ════════════════════════════════════════════════════════════════════════
--
-- Validação: ações nascem PENDENTE (mas já contam PA pro dashboard).
-- Admin pode aprovar / ajustar quantidade / rejeitar. REJEITADA não conta.
--
-- Loja: colaborador troca PA por gift cards de R$50 a R$500 (incrementos
-- de R$50). Resgates ficam PENDENTE até admin aprovar/entregar/rejeitar.
--
-- Idempotente.
-- ════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StatusAcao') THEN
    CREATE TYPE "StatusAcao" AS ENUM ('PENDENTE', 'APROVADA', 'REJEITADA');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StatusResgate') THEN
    CREATE TYPE "StatusResgate" AS ENUM ('PENDENTE', 'APROVADO', 'ENTREGUE', 'REJEITADO');
  END IF;
END$$;

ALTER TABLE public."acoes_pontuadas"
  ADD COLUMN IF NOT EXISTS "status"       "StatusAcao" NOT NULL DEFAULT 'PENDENTE',
  ADD COLUMN IF NOT EXISTS "validado_em"  timestamptz,
  ADD COLUMN IF NOT EXISTS "validado_por" uuid REFERENCES public."colaboradores"(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS acoes_pontuadas_status_idx
  ON public."acoes_pontuadas" (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public."loja_resgates" (
  id              uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id  uuid             NOT NULL REFERENCES public."colaboradores"(id) ON DELETE CASCADE,
  valor_reais     int              NOT NULL CHECK (valor_reais > 0),
  pa_gasto        numeric(10,2)    NOT NULL,
  status          "StatusResgate"  NOT NULL DEFAULT 'PENDENTE',
  observacao      text,
  created_at      timestamptz      NOT NULL DEFAULT now(),
  resolvido_em    timestamptz,
  resolvido_por   uuid             REFERENCES public."colaboradores"(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS loja_resgates_colab_idx  ON public."loja_resgates" (colaborador_id, created_at DESC);
CREATE INDEX IF NOT EXISTS loja_resgates_status_idx ON public."loja_resgates" (status, created_at DESC);

ALTER TABLE public."loja_resgates" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS resgates_read         ON public."loja_resgates";
DROP POLICY IF EXISTS resgates_insert_self  ON public."loja_resgates";
DROP POLICY IF EXISTS resgates_admin_write  ON public."loja_resgates";

CREATE POLICY resgates_read ON public."loja_resgates"
  FOR SELECT TO authenticated
  USING (colaborador_id = public.current_colaborador_id() OR public.current_is_admin());

CREATE POLICY resgates_insert_self ON public."loja_resgates"
  FOR INSERT TO authenticated
  WITH CHECK (colaborador_id = public.current_colaborador_id());

CREATE POLICY resgates_admin_write ON public."loja_resgates"
  FOR UPDATE TO authenticated
  USING (public.current_is_admin())
  WITH CHECK (public.current_is_admin());

ALTER TABLE public."loja_resgates" REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'loja_resgates'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public."loja_resgates";
  END IF;
END$$;
