// POST /api/deliveries — collaborator self-logs daily deliveries.
// Each entry: { material: <category>, count: <int> }.
// Server resolves the active DeliveryWeight by category and freezes pointsApplied = count × weight.
// Also creates an XpEvent in the active season so commission AND ranking get the same units.

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
  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const season = await prisma.season.findFirst({ where: { isActive: true } });

  const created = await prisma.$transaction(async (tx) => {
    const out = [];
    for (const e of parsed.data.entries) {
      const w = await tx.deliveryWeight.findFirst({
        where: { category: e.material, active: true },
      });
      if (!w) {
        throw new Error(`Categoria desconhecida: ${e.material}`);
      }
      const points = e.count * w.weight;
      const delivery = await tx.delivery.create({
        data: {
          userId: user.id,
          weightId: w.id,
          count: e.count,
          pointsApplied: points,
          deliveredAt: new Date(),
          registeredById: user.id, // self-logged
        },
      });
      if (season) {
        await tx.xpEvent.create({
          data: {
            userId: user.id,
            seasonId: season.id,
            amount: Math.round(points * 40), // XP heuristic ported from prototype
            source: "delivery",
            refId: delivery.id,
          },
        });
      }
      out.push(delivery);
    }
    return out;
  });

  return NextResponse.json({ ok: true, count: created.length });
}
