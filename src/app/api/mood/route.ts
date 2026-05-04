// POST /api/mood — collaborator submits the weekly anonymous mood entry.
// One per (userId, weekISO). userId stored only for dedupe + LOW_MOOD alert; never exposed in admin UI.

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const Body = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).nullable().optional(),
});

function isoWeek(d: Date): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((t.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7,
    );
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export async function POST(req: Request) {
  const user = await requireAppUser();
  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Inválido." }, { status: 400 });
  }
  const weekISO = isoWeek(new Date());
  await prisma.moodEntry.upsert({
    where: { userId_weekISO: { userId: user.id, weekISO } },
    update: { rating: parsed.data.rating, comment: parsed.data.comment ?? null },
    create: {
      userId: user.id,
      weekISO,
      rating: parsed.data.rating,
      comment: parsed.data.comment ?? null,
    },
  });
  return NextResponse.json({ ok: true });
}
