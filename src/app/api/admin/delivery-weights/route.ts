// POST /api/admin/delivery-weights — admin cria nova categoria com peso.
// Body: { category, group, weight, active? }

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const Body = z.object({
  category: z.string().min(1),
  group: z.enum(["HIGH", "MEDIUM", "LOW"]),
  weight: z.number().positive(),
  active: z.boolean().default(true),
});

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

  try {
    const created = await prisma.deliveryWeight.create({
      data: {
        category: parsed.data.category.trim(),
        group: parsed.data.group,
        weight: parsed.data.weight,
        active: parsed.data.active,
      },
    });
    return NextResponse.json({ ok: true, id: created.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Falha ao criar categoria";
    if (msg.includes("Unique") || msg.includes("unique")) {
      return NextResponse.json(
        { error: "Já existe uma categoria com esse nome" },
        { status: 409 },
      );
    }
    console.error("[api/admin/delivery-weights POST]", err);
    return NextResponse.json({ error: "Falha ao criar categoria" }, { status: 500 });
  }
}
