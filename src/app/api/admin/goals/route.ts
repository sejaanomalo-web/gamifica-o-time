// POST /api/admin/goals — admin cria meta pra um colaborador.
// Body: { ownerId, title, kpi, target, deadline, xpReward, scope, monthISO?, yearISO?, needsEvidence?, description? }
//
// Regras:
// - scope=PERMANENT: monthISO e yearISO ignorados (zera no banco).
// - scope=MONTHLY: monthISO obrigatório no formato YYYY-MM.
// - scope=YEARLY: yearISO obrigatório no formato YYYY.
// - ownerId precisa ser um COLABORADOR (admin não recebe meta).

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidRewardConfig } from "@/lib/tiers";

const RewardStep = z.object({
  atXp: z.number().nonnegative(),
  rewardCents: z.number().int().nonnegative(),
  label: z.string().optional(),
});

const RewardConfigSchema = z.object({
  steps: z.array(RewardStep).min(1),
  finalBonusCents: z.number().int().nonnegative().optional(),
});

const Body = z
  .object({
    ownerId: z.string().min(1),
    title: z.string().min(1),
    description: z.string().optional().nullable(),
    kpi: z.string().min(1),
    target: z.number().positive(),
    deadline: z.string().min(1), // ISO date string
    xpReward: z.number().int().nonnegative().default(0),
    needsEvidence: z.boolean().default(false),
    scope: z.enum(["PERMANENT", "MONTHLY", "YEARLY"]),
    monthISO: z.string().regex(/^\d{4}-\d{2}$/).optional().nullable(),
    yearISO: z.string().regex(/^\d{4}$/).optional().nullable(),
    rewardConfig: RewardConfigSchema.optional().nullable(),
  })
  .refine(
    (d) => d.scope !== "MONTHLY" || !!d.monthISO,
    { message: "monthISO obrigatório quando scope=MONTHLY", path: ["monthISO"] },
  )
  .refine(
    (d) => d.scope !== "YEARLY" || !!d.yearISO,
    { message: "yearISO obrigatório quando scope=YEARLY", path: ["yearISO"] },
  );

export async function POST(req: Request) {
  await requireAdmin();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Payload inválido" },
      { status: 400 },
    );
  }

  // Owner precisa ser COLABORADOR
  const owner = await prisma.user.findUnique({ where: { id: parsed.data.ownerId } });
  if (!owner) {
    return NextResponse.json({ error: "Colaborador não encontrado" }, { status: 404 });
  }
  if (owner.role !== "COLABORADOR") {
    return NextResponse.json(
      { error: "Metas só podem ser atribuídas a colaboradores" },
      { status: 400 },
    );
  }

  // Resolve seasonId — usa season ativa
  const season = await prisma.season.findFirst({ where: { isActive: true } });
  if (!season) {
    return NextResponse.json(
      { error: "Sem temporada ativa. Cria uma temporada antes." },
      { status: 400 },
    );
  }

  // Normaliza monthISO/yearISO conforme scope
  const monthISO =
    parsed.data.scope === "MONTHLY" ? parsed.data.monthISO ?? null : null;
  const yearISO =
    parsed.data.scope === "YEARLY" ? parsed.data.yearISO ?? null : null;

  // Valida rewardConfig (extra check além do zod)
  const rewardConfig = parsed.data.rewardConfig ?? null;
  if (rewardConfig && !isValidRewardConfig(rewardConfig)) {
    return NextResponse.json({ error: "rewardConfig inválido" }, { status: 400 });
  }

  try {
    const goal = await prisma.goal.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        kpi: parsed.data.kpi,
        target: parsed.data.target,
        xpReward: parsed.data.xpReward,
        needsEvidence: parsed.data.needsEvidence,
        deadline: new Date(parsed.data.deadline),
        scope: parsed.data.scope,
        monthISO,
        yearISO,
        rewardConfig: rewardConfig
          ? (rewardConfig as unknown as object)
          : undefined,
        ownerId: parsed.data.ownerId,
        seasonId: season.id,
      },
    });
    return NextResponse.json({ ok: true, id: goal.id });
  } catch (err) {
    console.error("[api/admin/goals POST] failed:", err);
    return NextResponse.json(
      { error: "Falha ao criar meta. Verifica se a migration 005 foi aplicada." },
      { status: 500 },
    );
  }
}
