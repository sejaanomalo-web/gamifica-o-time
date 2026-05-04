// XP / level math.
// Curve: level N requires N * 1000 cumulative XP. Soft and predictable.

export function xpToLevel(xp: number): number {
  if (xp <= 0) return 1;
  return Math.floor(xp / 1000) + 1;
}

export function xpForLevel(level: number): number {
  return Math.max(0, level - 1) * 1000;
}

export function xpProgress(xp: number) {
  const level = xpToLevel(xp);
  const floor = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return {
    level,
    inLevel: xp - floor,
    levelSize: next - floor,
    pct: ((xp - floor) / (next - floor)) * 100,
    next,
    toNext: next - xp,
  };
}
