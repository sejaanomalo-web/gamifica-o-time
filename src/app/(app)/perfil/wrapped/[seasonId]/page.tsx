import { notFound } from "next/navigation";
import { WrappedCarousel } from "@/components/feature/wrapped/WrappedCarousel";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/auth";

export default async function WrappedPage({
  params,
}: {
  params: Promise<{ seasonId: string }>;
}) {
  const { seasonId } = await params;
  const user = await requireAppUser();
  const snap = await prisma.wrappedSnapshot.findUnique({
    where: { userId_seasonId: { userId: user.id, seasonId } },
    include: { season: true },
  });
  if (!snap) notFound();

  const rareBadge = snap.rareBadgeId
    ? await prisma.badge.findUnique({ where: { id: snap.rareBadgeId } })
    : null;

  const monthLabel = snap.season.startsAt.toLocaleDateString("pt-BR", { month: "long" });

  return (
    <WrappedCarousel
      snapshot={{
        goalsBeaten: snap.goalsBeaten,
        totalXp: snap.totalXp,
        peakDay: snap.peakDay,
        peakDayXp: snap.peakDayXp,
        rareBadgeName: rareBadge?.name ?? null,
        rareBadgePercent: snap.rareBadgePercent,
        comparisonXpDelta: snap.comparisonXpDelta,
        finalRank: snap.finalRank,
        closingPhrase: snap.closingPhrase,
        monthLabel,
        userFirstName: user.name.split(" ")[0],
      }}
    />
  );
}
