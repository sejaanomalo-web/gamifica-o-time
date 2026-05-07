// POST /api/deliveries — colaborador self-loga entregas do dia.
// Cada entry: { material: <category>, count: <int> }.
// Server resolve o DeliveryWeight ativo por category e congela
// pointsApplied = count × weight. XpEvent.amount = round(pointsApplied)
// (mesma unidade — sem multiplicador extra).
//
// Regras:
// - ADMIN não loga entregas (não compete no game).
// - Categorias precisam existir em DeliveryWeight.active=true (seed 001).
// - Sem Season ativa, registra a Delivery mas não cria XpEvent.

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const Body = z.object({
  entries: z
    .array(
      z.object({
        material: z.string().min(1),
        count: z.number().int().positive(),
      }),
    )
    .min(1),
});

export async function POST(req: Request) {
  const user = await requireAppUser();

  if (user.role === "ADMIN") {
    return NextResponse.json(
      { error: "Admins não registram entregas. O game é só para colaboradores." },
      { status: 403 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const season = await prisma.season.findFirst({ where: { isActive: true } });

  try {
    const created = await prisma.$transaction(async (tx) => {
      const out = [];
      for (const e of parsed.data.entries) {
        const w = await tx.deliveryWeight.findFirst({
          where: { category: e.material, active: true },
        });
        if (!w) {
          throw new CategoryNotFoundError(e.material);
        }
        const points = e.count * w.weight;
        const delivery = await tx.delivery.create({
          data: {
            userId: user.id,
            weightId: w.id,
            count: e.count,
            pointsApplied: points,
            deliveredAt: new Date(),
            registeredById: user.id,
          },
        });
        if (season) {
          // XP é a soma direta dos pontos. 1 Aula (2.0) = 2 XP, 2 Reels
          // (1.5+1.5) = 3 XP, 5 Estáticos = 5 XP. Round pra Int do schema.
          await tx.xpEvent.create({
            data: {
              userId: user.id,
              seasonId: season.id,
              amount: Math.round(points),
              source: "delivery",
              refId: delivery.id,
            },
          });
        }
        out.push(delivery);
      }
      return out;
    });

    return NextResponse.json({
      ok: true,
      count: created.length,
      seasonActive: !!season,
    });
  } catch (err) {
    if (err instanceof CategoryNotFoundError) {
      return NextResponse.json(
        { error: `Categoria desconhecida: ${err.category}. Rode o seed do banco.` },
        { status: 400 },
      );
    }
    console.error("[api/deliveries] failed:", err);
    return NextResponse.json(
      { error: "Falha ao registrar entregas. Tenta de novo." },
      { status: 500 },
    );
  }
}

class CategoryNotFoundError extends Error {
  constructor(public category: string) {
    super(`Categoria desconhecida: ${category}`);
  }
}
