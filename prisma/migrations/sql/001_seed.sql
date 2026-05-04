-- Seed inicial — pesos das categorias + Vinicius + Emanuel + tiers
-- Idempotente: pode rodar várias vezes sem duplicar.

-- ── DELIVERY WEIGHTS ─────────────────────────────────────────────────────
INSERT INTO "DeliveryWeight" ("id", "category", "group", "weight", "active", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'Aulas',            'HIGH',   2.0, true, NOW()),
  (gen_random_uuid()::text, 'YouTube',          'HIGH',   2.0, true, NOW()),
  (gen_random_uuid()::text, 'VSL',              'HIGH',   2.0, true, NOW()),
  (gen_random_uuid()::text, 'Reel',             'MEDIUM', 1.5, true, NOW()),
  (gen_random_uuid()::text, 'Criativo',         'MEDIUM', 1.5, true, NOW()),
  (gen_random_uuid()::text, 'Carrossel',        'MEDIUM', 1.5, true, NOW()),
  (gen_random_uuid()::text, 'Estáticos',        'LOW',    1.0, true, NOW()),
  (gen_random_uuid()::text, 'Carrossel fácil',  'LOW',    1.0, true, NOW()),
  (gen_random_uuid()::text, 'Story',            'LOW',    1.0, true, NOW())
ON CONFLICT ("category") DO NOTHING;

-- ── VINICIUS ─────────────────────────────────────────────────────────────
INSERT INTO "User" ("id", "email", "name", "area", "role", "createdAt")
VALUES (gen_random_uuid()::text, 'vinicius@anomalo.com.br', 'Vinicius', 'Edição/Produção', 'COLABORADOR', NOW())
ON CONFLICT ("email") DO NOTHING;

INSERT INTO "CommissionTier" (
  "id", "userId", "baseSalary",
  "baseMin", "baseMax",
  "m1Min", "m1Max", "m2Min", "m2Max", "excellenceMin",
  "m1BonusPer20", "m2BonusPer20", "excellenceFixedBonus", "excellenceBonusPer10",
  "excellenceBonusStep", "notes", "updatedAt"
)
SELECT
  gen_random_uuid()::text, u."id", 0,
  0, 79, 80, 159, 160, 240, 260,
  3000, 5000, 20000, 5000,
  10, 'Foco em volume. Performance histórica alta.', NOW()
FROM "User" u
WHERE u."email" = 'vinicius@anomalo.com.br'
ON CONFLICT ("userId") DO NOTHING;

-- ── EMANUEL ──────────────────────────────────────────────────────────────
INSERT INTO "User" ("id", "email", "name", "area", "role", "createdAt")
VALUES (gen_random_uuid()::text, 'emanuel@anomalo.com.br', 'Emanuel', 'Edição/Produção', 'COLABORADOR', NOW())
ON CONFLICT ("email") DO NOTHING;

INSERT INTO "CommissionTier" (
  "id", "userId", "baseSalary",
  "baseMin", "baseMax",
  "m1Min", "m1Max", "m2Min", "m2Max", "excellenceMin",
  "m1BonusPer20", "m2BonusPer20", "excellenceFixedBonus", "excellenceBonusPer10",
  "excellenceBonusStep", "notes", "updatedAt"
)
SELECT
  gen_random_uuid()::text, u."id", 0,
  0, 39, 40, 79, 80, 119, 120,
  3000, 5000, 10000, 2000,
  10, 'Foco em complexidade. Plano de crescimento gradativo.', NOW()
FROM "User" u
WHERE u."email" = 'emanuel@anomalo.com.br'
ON CONFLICT ("userId") DO NOTHING;

-- ── SEASON ATIVA ─────────────────────────────────────────────────────────
INSERT INTO "Season" ("id", "number", "startsAt", "endsAt", "isActive")
SELECT gen_random_uuid()::text, 1, NOW(), NOW() + INTERVAL '30 days', true
WHERE NOT EXISTS (SELECT 1 FROM "Season" WHERE "isActive" = true);
