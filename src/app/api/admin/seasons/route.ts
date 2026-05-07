// POST /api/admin/seasons — admin cria nova temporada.
// Body: { startsAt?: ISO, endsAt?: ISO, durationDays?: number }
// Defaults: startsAt = agora; endsAt = startsAt + (durationDays || 30) dias.
// Comportamento:
// - number = max(number) + 1 (auto-incremento).
// - Se houver Season ativa, ela é desativada (só pode ter uma ativa).
// - A nova nasce isActive=true.

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const Body = z.object({
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  durationDays: z.number().int().positive().optional(),
});

export async function POST(req: Request) {
  await requireAdmin();

  let json: unknown = {};
  try {
    json = await req.json();
  } catch {
    // body vazio também tá ok — usa defaults
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const startsAt = parsed.data.startsAt ? new Date(parsed.data.startsAt) : new Date();
  const days = parsed.data.durationDays ?? 30;
  const endsAt = parsed.data.endsAt
    ? new Date(parsed.data.endsAt)
    : new Date(startsAt.getTime() + days * 86400000);

  if (endsAt <= startsAt) {
    return NextResponse.json(
      { error: "endsAt precisa ser depois de startsAt" },
      { status: 400 },
    );
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      // Desativa a ativa atual (se houver)
      await tx.season.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      // Próximo número
      const last = await tx.season.findFirst({
        orderBy: { number: "desc" },
        select: { number: true },
      });
      const nextNumber = (last?.number ?? 0) + 1;

      return tx.season.create({
        data: {
          number: nextNumber,
          startsAt,
          endsAt,
          isActive: true,
        },
      });
    });

    return NextResponse.json({
      ok: true,
      id: created.id,
      number: created.number,
    });
  } catch (err) {
    console.error("[api/admin/seasons POST]", err);
    return NextResponse.json({ error: "Falha ao criar temporada" }, { status: 500 });
  }
}
