import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const user = await requireAppUser();
  const sub = await req.json();
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json({ error: "Subscription inválida." }, { status: 400 });
  }
  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    update: { p256dh: sub.keys.p256dh, auth: sub.keys.auth, userId: user.id },
    create: {
      userId: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
  });
  return NextResponse.json({ ok: true });
}
