// POST /api/push/send — internal trigger (admin only).
// Body: { userId: string; title: string; body: string; url?: string }

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push";

const Body = z.object({
  userId: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  url: z.string().url().optional(),
});

export async function POST(req: Request) {
  await requireAdmin();
  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Inválido." }, { status: 400 });
  }
  await sendPushToUser(parsed.data.userId, {
    title: parsed.data.title,
    body: parsed.data.body,
    url: parsed.data.url,
  });
  return NextResponse.json({ ok: true });
}
