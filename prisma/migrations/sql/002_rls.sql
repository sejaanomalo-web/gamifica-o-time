-- RLS — Row Level Security
--
-- Modelo: cada colaborador SÓ vê os próprios dados; admin vê tudo.
-- auth.uid() devolve o id do usuário no schema auth.users.
-- Mapeamos auth.email() → User.email (precisa bater na criação do usuário).
--
-- Idempotente: drop+recreate.

-- ── HELPERS ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.app_current_user_id()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT u."id" FROM public."User" u
  WHERE u."email" = (SELECT auth.email())
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.app_is_admin()
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public."User" u
    WHERE u."email" = (SELECT auth.email()) AND u."role" = 'ADMIN'
  )
$$;

-- ── ENABLE RLS ───────────────────────────────────────────────────────────

ALTER TABLE public."User"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Goal"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Evidence"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UserBadge"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Redeem"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."XpEvent"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Notification"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PushSubscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."MoodEntry"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AdminAlert"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."WrappedSnapshot"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Delivery"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Adjustment"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CommissionTier"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CommissionMonth"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."MuralEvent"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Season"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Badge"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ShopItem"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."DeliveryWeight"   ENABLE ROW LEVEL SECURITY;

-- ── USER ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS user_self_select ON public."User";
CREATE POLICY user_self_select ON public."User"
  FOR SELECT TO authenticated
  USING (
    "email" = (SELECT auth.email())
    OR (SELECT public.app_is_admin())
  );

DROP POLICY IF EXISTS user_self_update ON public."User";
CREATE POLICY user_self_update ON public."User"
  FOR UPDATE TO authenticated
  USING ("email" = (SELECT auth.email()))
  WITH CHECK ("email" = (SELECT auth.email()));

DROP POLICY IF EXISTS user_admin_all ON public."User";
CREATE POLICY user_admin_all ON public."User"
  FOR ALL TO authenticated
  USING ((SELECT public.app_is_admin()))
  WITH CHECK ((SELECT public.app_is_admin()));

-- ── GOAL ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS goal_owner_select ON public."Goal";
CREATE POLICY goal_owner_select ON public."Goal"
  FOR SELECT TO authenticated
  USING (
    "ownerId" = (SELECT public.app_current_user_id())
    OR (SELECT public.app_is_admin())
  );

DROP POLICY IF EXISTS goal_admin_write ON public."Goal";
CREATE POLICY goal_admin_write ON public."Goal"
  FOR ALL TO authenticated
  USING ((SELECT public.app_is_admin()))
  WITH CHECK ((SELECT public.app_is_admin()));

-- ── EVIDENCE ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS evidence_owner_rw ON public."Evidence";
CREATE POLICY evidence_owner_rw ON public."Evidence"
  FOR ALL TO authenticated
  USING (
    "userId" = (SELECT public.app_current_user_id())
    OR (SELECT public.app_is_admin())
  )
  WITH CHECK (
    "userId" = (SELECT public.app_current_user_id())
    OR (SELECT public.app_is_admin())
  );

-- ── USER BADGE ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS userbadge_self_select ON public."UserBadge";
CREATE POLICY userbadge_self_select ON public."UserBadge"
  FOR SELECT TO authenticated
  USING (
    "userId" = (SELECT public.app_current_user_id())
    OR (SELECT public.app_is_admin())
  );

DROP POLICY IF EXISTS userbadge_admin_insert ON public."UserBadge";
CREATE POLICY userbadge_admin_insert ON public."UserBadge"
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.app_is_admin()));

-- ── REDEEM ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS redeem_self_rw ON public."Redeem";
CREATE POLICY redeem_self_rw ON public."Redeem"
  FOR ALL TO authenticated
  USING (
    "userId" = (SELECT public.app_current_user_id())
    OR (SELECT public.app_is_admin())
  )
  WITH CHECK (
    "userId" = (SELECT public.app_current_user_id())
    OR (SELECT public.app_is_admin())
  );

-- ── XP EVENT (read-only pro colaborador; escrita via service-role) ──────

DROP POLICY IF EXISTS xpevent_self_select ON public."XpEvent";
CREATE POLICY xpevent_self_select ON public."XpEvent"
  FOR SELECT TO authenticated
  USING (
    "userId" = (SELECT public.app_current_user_id())
    OR (SELECT public.app_is_admin())
  );

-- ── NOTIFICATION ─────────────────────────────────────────────────────────

DROP POLICY IF EXISTS notif_self_rw ON public."Notification";
CREATE POLICY notif_self_rw ON public."Notification"
  FOR ALL TO authenticated
  USING ("userId" = (SELECT public.app_current_user_id()))
  WITH CHECK ("userId" = (SELECT public.app_current_user_id()));

-- ── PUSH SUBSCRIPTION ────────────────────────────────────────────────────

DROP POLICY IF EXISTS push_self_rw ON public."PushSubscription";
CREATE POLICY push_self_rw ON public."PushSubscription"
  FOR ALL TO authenticated
  USING ("userId" = (SELECT public.app_current_user_id()))
  WITH CHECK ("userId" = (SELECT public.app_current_user_id()));

-- ── MOOD ENTRY (REGRA DURA: anônima pro admin) ──────────────────────────
-- Colaborador lê e escreve só o próprio. Admin agrega via service-role,
-- bypassando RLS, e a UI nunca seleciona userId.

DROP POLICY IF EXISTS mood_self_rw ON public."MoodEntry";
CREATE POLICY mood_self_rw ON public."MoodEntry"
  FOR ALL TO authenticated
  USING ("userId" = (SELECT public.app_current_user_id()))
  WITH CHECK ("userId" = (SELECT public.app_current_user_id()));

-- ── ADMIN ALERT ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS adminalert_admin_only ON public."AdminAlert";
CREATE POLICY adminalert_admin_only ON public."AdminAlert"
  FOR ALL TO authenticated
  USING ((SELECT public.app_is_admin()))
  WITH CHECK ((SELECT public.app_is_admin()));

-- ── WRAPPED SNAPSHOT ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS wrapped_self_select ON public."WrappedSnapshot";
CREATE POLICY wrapped_self_select ON public."WrappedSnapshot"
  FOR SELECT TO authenticated
  USING (
    "userId" = (SELECT public.app_current_user_id())
    OR (SELECT public.app_is_admin())
  );

-- ── DELIVERY ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS delivery_self_select ON public."Delivery";
CREATE POLICY delivery_self_select ON public."Delivery"
  FOR SELECT TO authenticated
  USING (
    "userId" = (SELECT public.app_current_user_id())
    OR (SELECT public.app_is_admin())
  );

DROP POLICY IF EXISTS delivery_self_insert ON public."Delivery";
CREATE POLICY delivery_self_insert ON public."Delivery"
  FOR INSERT TO authenticated
  WITH CHECK (
    "userId" = (SELECT public.app_current_user_id())
    OR (SELECT public.app_is_admin())
  );

DROP POLICY IF EXISTS delivery_admin_update ON public."Delivery";
CREATE POLICY delivery_admin_update ON public."Delivery"
  FOR UPDATE TO authenticated
  USING ((SELECT public.app_is_admin()))
  WITH CHECK ((SELECT public.app_is_admin()));

-- ── ADJUSTMENT ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS adjustment_self_select ON public."Adjustment";
CREATE POLICY adjustment_self_select ON public."Adjustment"
  FOR SELECT TO authenticated
  USING (
    "userId" = (SELECT public.app_current_user_id())
    OR (SELECT public.app_is_admin())
  );

DROP POLICY IF EXISTS adjustment_admin_write ON public."Adjustment";
CREATE POLICY adjustment_admin_write ON public."Adjustment"
  FOR ALL TO authenticated
  USING ((SELECT public.app_is_admin()))
  WITH CHECK ((SELECT public.app_is_admin()));

-- ── COMMISSION TIER ──────────────────────────────────────────────────────

DROP POLICY IF EXISTS tier_self_select ON public."CommissionTier";
CREATE POLICY tier_self_select ON public."CommissionTier"
  FOR SELECT TO authenticated
  USING (
    "userId" = (SELECT public.app_current_user_id())
    OR (SELECT public.app_is_admin())
  );

DROP POLICY IF EXISTS tier_admin_write ON public."CommissionTier";
CREATE POLICY tier_admin_write ON public."CommissionTier"
  FOR ALL TO authenticated
  USING ((SELECT public.app_is_admin()))
  WITH CHECK ((SELECT public.app_is_admin()));

-- ── COMMISSION MONTH ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS month_self_select ON public."CommissionMonth";
CREATE POLICY month_self_select ON public."CommissionMonth"
  FOR SELECT TO authenticated
  USING (
    "userId" = (SELECT public.app_current_user_id())
    OR (SELECT public.app_is_admin())
  );

DROP POLICY IF EXISTS month_admin_write ON public."CommissionMonth";
CREATE POLICY month_admin_write ON public."CommissionMonth"
  FOR ALL TO authenticated
  USING ((SELECT public.app_is_admin()))
  WITH CHECK ((SELECT public.app_is_admin()));

-- ── MURAL EVENT ──────────────────────────────────────────────────────────
-- Mural é público pra todo o time autenticado.

DROP POLICY IF EXISTS mural_team_read ON public."MuralEvent";
CREATE POLICY mural_team_read ON public."MuralEvent"
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS mural_self_insert ON public."MuralEvent";
CREATE POLICY mural_self_insert ON public."MuralEvent"
  FOR INSERT TO authenticated
  WITH CHECK ("userId" = (SELECT public.app_current_user_id()));

-- ── REFERÊNCIA: Season, Badge, ShopItem, DeliveryWeight (read-all, admin-write) ─

DROP POLICY IF EXISTS season_team_read ON public."Season";
CREATE POLICY season_team_read ON public."Season"
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS season_admin_write ON public."Season";
CREATE POLICY season_admin_write ON public."Season"
  FOR ALL TO authenticated
  USING ((SELECT public.app_is_admin()))
  WITH CHECK ((SELECT public.app_is_admin()));

DROP POLICY IF EXISTS badge_team_read ON public."Badge";
CREATE POLICY badge_team_read ON public."Badge"
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS badge_admin_write ON public."Badge";
CREATE POLICY badge_admin_write ON public."Badge"
  FOR ALL TO authenticated
  USING ((SELECT public.app_is_admin()))
  WITH CHECK ((SELECT public.app_is_admin()));

DROP POLICY IF EXISTS shopitem_team_read ON public."ShopItem";
CREATE POLICY shopitem_team_read ON public."ShopItem"
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS shopitem_admin_write ON public."ShopItem";
CREATE POLICY shopitem_admin_write ON public."ShopItem"
  FOR ALL TO authenticated
  USING ((SELECT public.app_is_admin()))
  WITH CHECK ((SELECT public.app_is_admin()));

DROP POLICY IF EXISTS dw_team_read ON public."DeliveryWeight";
CREATE POLICY dw_team_read ON public."DeliveryWeight"
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS dw_admin_write ON public."DeliveryWeight";
CREATE POLICY dw_admin_write ON public."DeliveryWeight"
  FOR ALL TO authenticated
  USING ((SELECT public.app_is_admin()))
  WITH CHECK ((SELECT public.app_is_admin()));
