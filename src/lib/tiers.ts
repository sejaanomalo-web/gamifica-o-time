// Tiered reward calculation pra metas escaláveis.
// Shape do JSON em Goal.rewardConfig:
//
//   {
//     steps: [
//       { atXp: 100, rewardCents: 5000, label?: "Meta básica" },
//       { atXp: 200, rewardCents: 5000 },
//       { atXp: 500, rewardCents: 10000, label?: "Estrela" }
//     ],
//     finalBonusCents?: 20000   // bônus extra ao bater todos os steps
//   }
//
// Semântica: steps são CUMULATIVOS. Se o usuário tem 350 XP, ganhou
// os steps de 100 e 200 XP (5000 + 5000 = 10000 centavos = R$ 100).
// Se atingiu o último step (500 XP), soma também finalBonusCents.

export interface RewardStep {
  atXp: number;
  rewardCents: number;
  label?: string;
}

export interface RewardConfig {
  steps: RewardStep[];
  finalBonusCents?: number;
}

export interface RewardResult {
  totalCents: number;
  achievedSteps: RewardStep[];
  nextStep: RewardStep | null;
  xpUntilNext: number | null;
  hitFinalBonus: boolean;
}

export function calculateGoalReward(
  config: RewardConfig | null | undefined,
  currentXp: number,
): RewardResult {
  if (!config || !config.steps || config.steps.length === 0) {
    return {
      totalCents: 0,
      achievedSteps: [],
      nextStep: null,
      xpUntilNext: null,
      hitFinalBonus: false,
    };
  }

  const sorted = [...config.steps].sort((a, b) => a.atXp - b.atXp);
  const achieved = sorted.filter((s) => currentXp >= s.atXp);
  const remaining = sorted.filter((s) => currentXp < s.atXp);

  let total = achieved.reduce((sum, s) => sum + s.rewardCents, 0);

  const lastStep = sorted[sorted.length - 1];
  const hitFinal = !!lastStep && currentXp >= lastStep.atXp;
  if (hitFinal && config.finalBonusCents) total += config.finalBonusCents;

  const next = remaining[0] ?? null;
  const xpUntilNext = next ? next.atXp - currentXp : null;

  return {
    totalCents: total,
    achievedSteps: achieved,
    nextStep: next,
    xpUntilNext,
    hitFinalBonus: hitFinal,
  };
}

// Helpers de validação usados no API
export function isValidRewardConfig(value: unknown): value is RewardConfig {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<RewardConfig>;
  if (!Array.isArray(v.steps)) return false;
  if (v.steps.length === 0) return false;
  for (const s of v.steps) {
    if (typeof s.atXp !== "number" || s.atXp < 0) return false;
    if (typeof s.rewardCents !== "number" || s.rewardCents < 0) return false;
  }
  if (
    v.finalBonusCents !== undefined &&
    (typeof v.finalBonusCents !== "number" || v.finalBonusCents < 0)
  ) {
    return false;
  }
  return true;
}

export function formatCents(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}
