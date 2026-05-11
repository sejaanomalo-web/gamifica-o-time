// POST /api/pa/acoes — colaborador registra atividade.
// Body: { atividadeId, data, quantidade, cliente?, observacao? }
// pa_gerado = quantidade × atividade.paValor (calculado no server, congelado).

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireColaboradorPA } from "@/lib/pa-auth";
import { prisma } from "@/lib/prisma";

const Body = z.object({
  atividadeId: z.string().uuid(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  quantidade: z.number().int().positive(),
  cliente: z.string().optional().nullable(),
  observacao: z.string().optional().nullable(),
  colaboradorId: z.string().uuid().optional(), // só admin pode registrar pra outro
});

export async function POST(req: Request) {
  const colaborador = await requireColaboradorPA();

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

  // Quem vai receber o PA: por padrão o próprio colaborador.
  // Admin pode passar colaboradorId pra registrar em nome de outro.
  let alvoId = colaborador.id;
  if (parsed.data.colaboradorId && parsed.data.colaboradorId !== colaborador.id) {
    if (!colaborador.isAdmin) {
      return NextResponse.json(
        { error: "Só admin pode registrar atividade pra outro colaborador" },
        { status: 403 },
      );
    }
    alvoId = parsed.data.colaboradorId;
  }

  // Data não pode ser futura (exceto admin)
  const dataAcao = new Date(`${parsed.data.data}T12:00:00`);
  const hoje = new Date();
  hoje.setHours(23, 59, 59, 999);
  if (dataAcao > hoje && !colaborador.isAdmin) {
    return NextResponse.json(
      { error: "Não dá pra registrar atividade no futuro" },
      { status: 400 },
    );
  }

  // Pega a atividade pra congelar o pa_valor
  const atividade = await prisma.atividadeCatalogo.findUnique({
    where: { id: parsed.data.atividadeId },
  });
  if (!atividade || !atividade.ativo) {
    return NextResponse.json(
      { error: "Atividade não encontrada ou desativada" },
      { status: 404 },
    );
  }

  // Valida que a atividade pertence a uma função do colaborador (ou admin)
  const alvo = await prisma.colaborador.findUnique({ where: { id: alvoId } });
  if (!alvo) {
    return NextResponse.json({ error: "Colaborador não encontrado" }, { status: 404 });
  }
  if (!colaborador.isAdmin && !alvo.funcoes.includes(atividade.funcao)) {
    return NextResponse.json(
      { error: `Atividade "${atividade.nome}" não pertence à sua função` },
      { status: 400 },
    );
  }

  const paValor = Number(atividade.paValor);
  const paGerado = parsed.data.quantidade * paValor;
  const ehPenalidade = paValor < 0;

  try {
    const acao = await prisma.acaoPontuada.create({
      data: {
        colaboradorId: alvoId,
        atividadeId: atividade.id,
        data: dataAcao,
        quantidade: parsed.data.quantidade,
        paGerado,
        cliente: parsed.data.cliente ?? null,
        observacao: parsed.data.observacao ?? null,
        ehPenalidade,
        createdBy: colaborador.id,
      },
    });
    return NextResponse.json({
      ok: true,
      id: acao.id,
      paGerado: Number(acao.paGerado),
    });
  } catch (err) {
    console.error("[api/pa/acoes POST]", err);
    return NextResponse.json({ error: "Falha ao registrar ação" }, { status: 500 });
  }
}
