// PATCH /api/admin/goals/[id] — admin edita meta existente.
// DELETE /api/admin/goals/[id] — admin remove meta.

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

const PatchBody = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    kpi: z.string().min(1).optional(),
    target: z.number().positive().optional(),
    deadline: z.string().min(1).optional(),
    xpReward: z.number().int().nonnegative().optional(),
    needsEvidence: z.boolean().optional(),
    status: z.enum(["ATIVA", "CONCLUIDA", "NAO_BATIDA", "AGUARDANDO_VALIDACAO", "REJEITADA"]).optional(),
    scope: z.enum(["PERMANENT", "MONTHLY", "YEARLY"]).optional(),
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

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await ctx.params;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = PatchBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Payload inválido" },
      { status: 400 },
    );
  }

  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined) data[k] = v;
  }

  // Quando scope muda, normaliza monthISO/yearISO
  if (parsed.data.scope === "PERMANENT") {
    data.monthISO = null;
    data.yearISO = null;
  } else if (parsed.data.scope === "MONTHLY") {
    data.yearISO = null;
  } else if (parsed.data.scope === "YEARLY") {
    data.monthISO = null;
  }

  if (typeof data.deadline === "string") {
    data.deadline = new Date(data.deadline);
  }

  // Valida rewardConfig se vier (null é permitido — limpa o campo)
  if (parsed.data.rewardConfig && !isValidRewardConfig(parsed.data.rewardConfig)) {
    return NextResponse.json({ error: "rewardConfig inválido" }, { status: 400 });
  }

  try {
    await prisma.goal.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/admin/goals PATCH] failed:", err);
    return NextResponse.json({ error: "Falha ao atualizar meta" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await ctx.params;

  try {
    await prisma.goal.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/admin/goals DELETE] failed:", err);
    return NextResponse.json({ error: "Falha ao remover meta" }, { status: 500 });
  }
}
