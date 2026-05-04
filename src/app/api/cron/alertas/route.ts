// Daily 6am UTC. Generates AdminAlerts for: NO_LOGIN (5+ days), NO_GOAL (60+ days), LOW_MOOD (≤2 over 2 weeks).
// Idempotent: never duplicates an ACTIVE alert of same (target, type).

import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const NO_LOGIN_DAYS = 5;
const NO_GOAL_DAYS = 60;
const LOW_MOOD_THRESHOLD = 2;
const LOW_MOOD_WEEKS = 2;

async function ensureAlert(args: {
  targetUserId: string;
  type: "NO_LOGIN" | "NO_GOAL" | "LOW_MOOD";
  severity: "LOW" | "MEDIUM" | "HIGH";
  message: string;
}) {
  const exists = await prisma.adminAlert.findFirst({
    where: { targetUserId: args.targetUserId, type: args.type, status: "ACTIVE" },
  });
  if (exists) return;
  await prisma.adminAlert.create({ data: args });
}

export async function GET(req: Request) {
  const denied = authorizeCron(req);
  if (denied) return denied;

  const users = await prisma.user.findMany({ where: { role: "COLABORADOR" } });
  const now = new Date();

  for (const u of users) {
    if (u.lastLoginAt) {
      const days = (now.getTime() - u.lastLoginAt.getTime()) / 86400000;
      if (days >= NO_LOGIN_DAYS) {
        await ensureAlert({
          targetUserId: u.id,
          type: "NO_LOGIN",
          severity: days >= 14 ? "HIGH" : "MEDIUM",
          message: `Sem login há ${Math.floor(days)} dias.`,
        });
      }
    }

    const lastGoal = await prisma.goal.findFirst({
      where: { ownerId: u.id, status: "CONCLUIDA" },
      orderBy: { updatedAt: "desc" },
    });
    if (!lastGoal || (now.getTime() - lastGoal.updatedAt.getTime()) / 86400000 >= NO_GOAL_DAYS) {
      await ensureAlert({
        targetUserId: u.id,
        type: "NO_GOAL",
        severity: "MEDIUM",
        message: lastGoal ? `Sem bater meta há ${NO_GOAL_DAYS}+ dias.` : `Nunca bateu uma meta.`,
      });
    }

    const lastMoods = await prisma.moodEntry.findMany({
      where: { userId: u.id },
      orderBy: { createdAt: "desc" },
      take: LOW_MOOD_WEEKS,
    });
    if (
      lastMoods.length >= LOW_MOOD_WEEKS &&
      lastMoods.every((m) => m.rating <= LOW_MOOD_THRESHOLD)
    ) {
      await ensureAlert({
        targetUserId: u.id,
        type: "LOW_MOOD",
        severity: "HIGH",
        message: `Mood baixo recorrente nas últimas ${LOW_MOOD_WEEKS} semanas.`,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
