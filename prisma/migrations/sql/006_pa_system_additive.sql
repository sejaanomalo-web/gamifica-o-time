-- ════════════════════════════════════════════════════════════════════════
-- 006 · SISTEMA DE COMISSIONAMENTO COLETIVO (PA) — VERSÃO ADITIVA
-- ════════════════════════════════════════════════════════════════════════
--
-- ADITIVA: cria as 5 tabelas novas (colaboradores, atividades_catalogo,
-- acoes_pontuadas, metas_config, fechamentos_mensais) SEM tocar nas
-- tabelas existentes (User, Goal, Delivery, etc).
--
-- Permite que o sistema atual continue rodando enquanto a nova feature
-- é desenvolvida e validada. Quando o time aprovar o PA, uma migration
-- futura (007) faz o cleanup das tabelas antigas.
--
-- Idempotente: pode rodar várias vezes sem duplicar.
-- ════════════════════════════════════════════════════════════════════════

-- ── ENUMs ─────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FuncaoEquipe') THEN
    CREATE TYPE "FuncaoEquipe" AS ENUM (
      'sdr', 'design', 'trafego', 'social_midia', 'video_maker', 'closer'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NivelMeta') THEN
    CREATE TYPE "NivelMeta" AS ENUM ('base', 'meta_1', 'meta_2', 'excelencia');
  END IF;
END$$;

-- ── colaboradores ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public."colaboradores" (
  id          uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text             UNIQUE NOT NULL,
  nome        text             NOT NULL,
  funcoes     "FuncaoEquipe"[] NOT NULL DEFAULT '{}',
  is_admin    boolean          NOT NULL DEFAULT false,
  ativo       boolean          NOT NULL DEFAULT true,
  avatar_url  text,
  created_at  timestamptz      NOT NULL DEFAULT now(),
  updated_at  timestamptz      NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS colaboradores_ativo_idx    ON public."colaboradores" (ativo);
CREATE INDEX IF NOT EXISTS colaboradores_is_admin_idx ON public."colaboradores" (is_admin);

-- ── atividades_catalogo ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public."atividades_catalogo" (
  id         uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  funcao     "FuncaoEquipe" NOT NULL,
  nome       text           NOT NULL,
  codigo     text           UNIQUE NOT NULL,
  pa_valor   numeric(10,2)  NOT NULL,
  ativo      boolean        NOT NULL DEFAULT true,
  ordem      int            NOT NULL DEFAULT 0,
  created_at timestamptz    NOT NULL DEFAULT now(),
  updated_at timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS atividades_catalogo_funcao_idx
  ON public."atividades_catalogo" (funcao, ativo);

-- ── acoes_pontuadas ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public."acoes_pontuadas" (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id uuid          NOT NULL REFERENCES public."colaboradores"(id) ON DELETE CASCADE,
  atividade_id   uuid          NOT NULL REFERENCES public."atividades_catalogo"(id) ON DELETE RESTRICT,
  data           date          NOT NULL,
  quantidade     int           NOT NULL DEFAULT 1 CHECK (quantidade > 0),
  pa_gerado      numeric(10,2) NOT NULL,
  cliente        text,
  observacao     text,
  eh_penalidade  boolean       NOT NULL DEFAULT false,
  created_at     timestamptz   NOT NULL DEFAULT now(),
  created_by     uuid          REFERENCES public."colaboradores"(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS acoes_pontuadas_colab_data_idx
  ON public."acoes_pontuadas" (colaborador_id, data DESC);
CREATE INDEX IF NOT EXISTS acoes_pontuadas_data_idx
  ON public."acoes_pontuadas" (data DESC);
CREATE INDEX IF NOT EXISTS acoes_pontuadas_created_at_idx
  ON public."acoes_pontuadas" (created_at DESC);

-- ── metas_config ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public."metas_config" (
  nivel           "NivelMeta"   PRIMARY KEY,
  pa_minimo       int           NOT NULL,
  pa_maximo       int,
  bonus_milestone numeric(10,2) NOT NULL DEFAULT 0
);

-- ── fechamentos_mensais ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public."fechamentos_mensais" (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id   uuid          NOT NULL REFERENCES public."colaboradores"(id) ON DELETE RESTRICT,
  mes_ano          text          NOT NULL,
  pa_total         numeric(10,2) NOT NULL,
  nivel_atingido   "NivelMeta"   NOT NULL,
  valor_por_pontos numeric(10,2) NOT NULL,
  bonus_milestone  numeric(10,2) NOT NULL DEFAULT 0,
  total_comissao   numeric(10,2) NOT NULL,
  fechado_em       timestamptz   NOT NULL DEFAULT now(),
  fechado_por      uuid          REFERENCES public."colaboradores"(id) ON DELETE SET NULL,

  UNIQUE (colaborador_id, mes_ano)
);

CREATE INDEX IF NOT EXISTS fechamentos_mensais_mes_ano_idx
  ON public."fechamentos_mensais" (mes_ano DESC);

-- ════════════════════════════════════════════════════════════════════════
-- SEEDS (idempotentes via ON CONFLICT)
-- ════════════════════════════════════════════════════════════════════════

-- metas_config (patamares universais)
INSERT INTO public."metas_config" (nivel, pa_minimo, pa_maximo, bonus_milestone) VALUES
  ('base',       0,   79,  0),
  ('meta_1',     80,  159, 50),
  ('meta_2',     160, 239, 100),
  ('excelencia', 240, NULL, 200)
ON CONFLICT (nivel) DO UPDATE
SET pa_minimo = EXCLUDED.pa_minimo,
    pa_maximo = EXCLUDED.pa_maximo,
    bonus_milestone = EXCLUDED.bonus_milestone;

-- colaboradores (5 do time) — emails reais do Supabase Auth
INSERT INTO public."colaboradores" (email, nome, funcoes, is_admin) VALUES
  ('emanuelkreis6@gmail.com',   'Emanuel',  ARRAY['sdr']::"FuncaoEquipe"[],                          false),
  ('viniciusfern16@gmail.com',  'Vinicius', ARRAY['design']::"FuncaoEquipe"[],                       false),
  ('anomalofelipe@gmail.com',   'Felipe',   ARRAY['trafego']::"FuncaoEquipe"[],                      false),
  ('cttbrunofreitas@gmail.com', 'Bruno',    ARRAY['social_midia','video_maker']::"FuncaoEquipe"[],   true),
  ('alisson.ajp17@gmail.com',   'Alisson',  ARRAY['closer','video_maker']::"FuncaoEquipe"[],         true)
ON CONFLICT (email) DO UPDATE
SET nome = EXCLUDED.nome,
    funcoes = EXCLUDED.funcoes,
    is_admin = EXCLUDED.is_admin;

-- atividades_catalogo · SDR
INSERT INTO public."atividades_catalogo" (funcao, nome, codigo, pa_valor, ordem) VALUES
  ('sdr', 'Pacote de 20 mensagens de prospecção fria no dia', 'sdr_prospec_20',         3.0,  1),
  ('sdr', 'Lead qualificado entregue',                        'sdr_lead_qualificado',   0.5,  2),
  ('sdr', 'Reunião agendada',                                 'sdr_reuniao_agendada',   2.0,  3),
  ('sdr', 'Reunião com show (cliente apareceu)',              'sdr_reuniao_show',       3.0,  4),
  ('sdr', 'Lead convertido em contrato (assist)',             'sdr_conversao_assist',   5.0,  5),
  ('sdr', 'Penalidade: no-show por falha de qualificação',    'sdr_pen_noshow',        -3.0, 99)
ON CONFLICT (codigo) DO UPDATE
SET nome = EXCLUDED.nome, pa_valor = EXCLUDED.pa_valor, ordem = EXCLUDED.ordem;

-- Design (Vinicius) — inclui dupla pontuação por viral (espelha Bruno/Social)
INSERT INTO public."atividades_catalogo" (funcao, nome, codigo, pa_valor, ordem) VALUES
  ('design', 'Estático, story ou carrossel fácil',    'design_estatico_facil', 1.0,  1),
  ('design', 'Reel, criativo ou carrossel completo',  'design_reel_carrossel', 1.5,  2),
  ('design', 'Aula, YouTube ou VSL',                  'design_aula_yt_vsl',    2.0,  3),
  ('design', 'Reel editado com 10k+ views orgânicos', 'design_reel_10k',       3.0,  4),
  ('design', 'Conteúdo viral editado (50k+ views)',   'design_viral_50k',      8.0,  5),
  ('design', 'Penalidade: ajuste ou retrabalho',      'design_pen_retrabalho',-5.0, 99)
ON CONFLICT (codigo) DO UPDATE
SET nome = EXCLUDED.nome, pa_valor = EXCLUDED.pa_valor, ordem = EXCLUDED.ordem;

-- Tráfego
INSERT INTO public."atividades_catalogo" (funcao, nome, codigo, pa_valor, ordem) VALUES
  ('trafego', 'Atualização diária da planilha',               'trafego_planilha_diaria',     2.0,  1),
  ('trafego', 'Campanha estruturada e publicada',             'trafego_campanha_publicada',  3.0,  2),
  ('trafego', 'Otimização documentada',                       'trafego_otimizacao',          1.5,  3),
  ('trafego', 'Meta CPL/CPA do cliente atingida no mês',      'trafego_meta_cpl',            8.0,  4),
  ('trafego', 'ROAS acima de 2x no cliente no mês',           'trafego_roas_2x',            12.0,  5),
  ('trafego', 'Penalidade: campanha parada por descuido',     'trafego_pen_parada',         -3.0, 99)
ON CONFLICT (codigo) DO UPDATE
SET nome = EXCLUDED.nome, pa_valor = EXCLUDED.pa_valor, ordem = EXCLUDED.ordem;

-- Social Mídia
INSERT INTO public."atividades_catalogo" (funcao, nome, codigo, pa_valor, ordem) VALUES
  ('social_midia', 'Posts da semana entregues até quinta (por cliente)', 'social_posts_semana',    3.0,  1),
  ('social_midia', 'Roteiro de Reels ou conteúdo escrito',               'social_roteiro',          1.5,  2),
  ('social_midia', 'Landing page entregue',                              'social_landing',         12.0,  3),
  ('social_midia', 'Site institucional entregue',                        'social_site',            20.0,  4),
  ('social_midia', 'Sistema ou dashboard entregue',                      'social_sistema',         25.0,  5),
  ('social_midia', 'Reunião com cliente conduzida',                      'social_reuniao',          1.0,  6),
  ('social_midia', 'Cronograma semanal completo entregue até sábado',    'social_cronograma',       6.0,  7),
  ('social_midia', 'Reel publicado com 10k+ views orgânicos',            'social_reel_10k',         3.0,  8),
  ('social_midia', 'Conteúdo viral (50k+ views)',                        'social_viral_50k',        8.0,  9),
  ('social_midia', 'Penalidade: postagem com erro grave',                'social_pen_erro',        -2.0, 99)
ON CONFLICT (codigo) DO UPDATE
SET nome = EXCLUDED.nome, pa_valor = EXCLUDED.pa_valor, ordem = EXCLUDED.ordem;

-- Video Maker
INSERT INTO public."atividades_catalogo" (funcao, nome, codigo, pa_valor, ordem) VALUES
  ('video_maker', 'Reel gravado e entregue em captação',                 'video_reel_gravado',  1.5,  1),
  ('video_maker', 'Bônus: sessão completa de captação (8+ Reels)',       'video_bonus_sessao',  5.0,  2),
  ('video_maker', 'Conteúdo longo gravado (podcast, aula, VSL)',         'video_longo',         4.0,  3),
  ('video_maker', 'Bônus: gravação externa com deslocamento',            'video_bonus_externa', 3.0,  4),
  ('video_maker', 'Penalidade: gravação que exija retake',               'video_pen_retake',   -2.0, 99)
ON CONFLICT (codigo) DO UPDATE
SET nome = EXCLUDED.nome, pa_valor = EXCLUDED.pa_valor, ordem = EXCLUDED.ordem;

-- Closer
INSERT INTO public."atividades_catalogo" (funcao, nome, codigo, pa_valor, ordem) VALUES
  ('closer', 'Reunião de fechamento conduzida',         'closer_reuniao',         2.0,  1),
  ('closer', 'Contrato fechado até R$ 2.000',           'closer_contrato_baixo', 10.0,  2),
  ('closer', 'Contrato fechado de R$ 2.001 a R$ 5.000', 'closer_contrato_medio', 20.0,  3),
  ('closer', 'Contrato fechado acima de R$ 5.000',      'closer_contrato_alto',  35.0,  4),
  ('closer', 'Renovação de contrato',                   'closer_renovacao',       8.0,  5),
  ('closer', 'Penalidade: reunião perdida sem motivo',  'closer_pen_perdida',    -3.0, 99)
ON CONFLICT (codigo) DO UPDATE
SET nome = EXCLUDED.nome, pa_valor = EXCLUDED.pa_valor, ordem = EXCLUDED.ordem;

-- ════════════════════════════════════════════════════════════════════════
-- RLS
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE public."colaboradores"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."atividades_catalogo"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."acoes_pontuadas"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."metas_config"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."fechamentos_mensais"    ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_colaborador_id() RETURNS uuid AS $$
  SELECT c.id
  FROM public."colaboradores" c
  JOIN auth.users u ON u.email = c.email
  WHERE u.id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_is_admin() RETURNS boolean AS $$
  SELECT c.is_admin
  FROM public."colaboradores" c
  JOIN auth.users u ON u.email = c.email
  WHERE u.id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

DROP POLICY IF EXISTS colab_read           ON public."colaboradores";
DROP POLICY IF EXISTS colab_admin_write    ON public."colaboradores";
DROP POLICY IF EXISTS atividades_read      ON public."atividades_catalogo";
DROP POLICY IF EXISTS atividades_admin_write ON public."atividades_catalogo";
DROP POLICY IF EXISTS acoes_read           ON public."acoes_pontuadas";
DROP POLICY IF EXISTS acoes_insert         ON public."acoes_pontuadas";
DROP POLICY IF EXISTS acoes_update         ON public."acoes_pontuadas";
DROP POLICY IF EXISTS acoes_delete         ON public."acoes_pontuadas";
DROP POLICY IF EXISTS metas_read           ON public."metas_config";
DROP POLICY IF EXISTS metas_admin_write    ON public."metas_config";
DROP POLICY IF EXISTS fechamentos_read     ON public."fechamentos_mensais";
DROP POLICY IF EXISTS fechamentos_admin_write ON public."fechamentos_mensais";

CREATE POLICY colab_read           ON public."colaboradores"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY colab_admin_write    ON public."colaboradores"
  FOR ALL TO authenticated
  USING (public.current_is_admin())
  WITH CHECK (public.current_is_admin());

CREATE POLICY atividades_read      ON public."atividades_catalogo"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY atividades_admin_write ON public."atividades_catalogo"
  FOR ALL TO authenticated
  USING (public.current_is_admin())
  WITH CHECK (public.current_is_admin());

CREATE POLICY acoes_read           ON public."acoes_pontuadas"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY acoes_insert         ON public."acoes_pontuadas"
  FOR INSERT TO authenticated
  WITH CHECK (colaborador_id = public.current_colaborador_id() OR public.current_is_admin());
CREATE POLICY acoes_update         ON public."acoes_pontuadas"
  FOR UPDATE TO authenticated
  USING (colaborador_id = public.current_colaborador_id() OR public.current_is_admin());
CREATE POLICY acoes_delete         ON public."acoes_pontuadas"
  FOR DELETE TO authenticated
  USING (colaborador_id = public.current_colaborador_id() OR public.current_is_admin());

CREATE POLICY metas_read           ON public."metas_config"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY metas_admin_write    ON public."metas_config"
  FOR ALL TO authenticated
  USING (public.current_is_admin())
  WITH CHECK (public.current_is_admin());

CREATE POLICY fechamentos_read     ON public."fechamentos_mensais"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY fechamentos_admin_write ON public."fechamentos_mensais"
  FOR ALL TO authenticated
  USING (public.current_is_admin())
  WITH CHECK (public.current_is_admin());

-- ════════════════════════════════════════════════════════════════════════
-- REALTIME
-- ════════════════════════════════════════════════════════════════════════
ALTER TABLE public."acoes_pontuadas" REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'acoes_pontuadas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public."acoes_pontuadas";
  END IF;
END$$;
