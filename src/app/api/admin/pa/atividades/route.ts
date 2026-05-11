// POST /api/admin/pa/atividades — admin cria nova atividade no catálogo.
// Body: { funcao, nome, codigo, paValor, ordem? }

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminPA } from "@/lib/pa-auth";
import { prisma } from "@/lib/prisma";

const Body = z.object({
  funcao: z.enum(["sdr", "design", "trafego", "social_midia", "video_maker", "closer"]),
  nome: z.string().min(1),
  codigo: z.string().min(1).regex(/^[a-z0-9_]+$/, "codigo deve ser minúsculo, números e underscore"),
  paValor: z.number(),
  ordem: z.number().int().default(0),
});

export async function POST(req: Request) {
  await requireAdminPA();

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
    const created = await prisma.atividadeCatalogo.create({
      data: {
        funcao: parsed.data.funcao,
        nome: parsed.data.nome.trim(),
        codigo: parsed.data.codigo.trim(),
        paValor: parsed.data.paValor,
        ordem: parsed.data.ordem,
      },
    });
    return NextResponse.json({ ok: true, id: created.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Unique") || msg.includes("unique")) {
      return NextResponse.json(
        { error: "Já existe uma atividade com esse código" },
        { status: 409 },
      );
    }
    console.error("[api/admin/pa/atividades POST]", err);
    return NextResponse.json({ error: "Falha ao criar atividade" }, { status: 500 });
  }
}
