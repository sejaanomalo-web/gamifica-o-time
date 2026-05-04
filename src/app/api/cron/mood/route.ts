// Friday 19:00 UTC (~16:00 BRT). Notify collaborators who haven't answered the current week.

import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";

export const dynamic = "force-dynamic";

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

export async function GET(req: Request) {
  const denied = authorizeCron(req);
  if (denied) return denied;

  const week = isoWeek(new Date());
  const users = await prisma.user.findMany({ where: { role: "COLABORADOR" } });

  let sent = 0;
  for (const u of users) {
    const exists = await prisma.moodEntry.findUnique({
      where: { userId_weekISO: { userId: u.id, weekISO: week } },
    });
    if (exists) continue;
    await sendPushToUser(u.id, {
      title: "Como foi a semana?",
      body: "Nota de 1 a 5. Anônimo.",
      url: "/mood",
    });
    sent++;
  }
  return NextResponse.json({ ok: true, sent });
}
