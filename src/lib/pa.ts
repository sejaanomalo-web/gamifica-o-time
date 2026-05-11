// Cálculo de PA, nível e comissão — fonte única de verdade pra UI e API.
// Mesmas regras da spec Anômalo Hub:
// - R$ 1,50 por PA
// - Bônus milestone acumulado: 50 (meta_1) + 100 (meta_2) + 200 (excelencia)
// - Patamares: 0/80/160/240

export type Nivel = "base" | "meta_1" | "meta_2" | "excelencia";

export const VALOR_POR_PA = 1.5;

export const NIVEIS = {
  base: { pa_minimo: 0, pa_maximo: 79, bonus: 0 },
  meta_1: { pa_minimo: 80, pa_maximo: 159, bonus: 50 },
  meta_2: { pa_minimo: 160, pa_maximo: 239, bonus: 100 },
  excelencia: { pa_minimo: 240, pa_maximo: null, bonus: 200 },
} as const;

export const NIVEL_LABEL: Record<Nivel, string> = {
  base: "Base",
  meta_1: "Meta 1",
  meta_2: "Meta 2",
  excelencia: "Excelência",
};

// Cor por nível (alinhada com tokens Anômalo)
export const NIVEL_COR: Record<Nivel, string> = {
  base: "#8A7850",
  meta_1: "#FFFFFF",
  meta_2: "#C9953A",
  excelencia: "#E0B25A",
};

export function calcularNivel(paTotal: number): Nivel {
  if (paTotal >= 240) return "excelencia";
  if (paTotal >= 160) return "meta_2";
  if (paTotal >= 80) return "meta_1";
  return "base";
}

export interface ComissaoResult {
  valorPorPontos: number;
  bonusMilestone: number;
  totalComissao: number;
  nivel: Nivel;
}

export function calcularComissao(paTotal: number): ComissaoResult {
  const paClampado = Math.max(0, paTotal);
  const valorPorPontos = paClampado * VALOR_POR_PA;

  let bonus = 0;
  if (paClampado >= 80) bonus += NIVEIS.meta_1.bonus;
  if (paClampado >= 160) bonus += NIVEIS.meta_2.bonus;
  if (paClampado >= 240) bonus += NIVEIS.excelencia.bonus;

  return {
    valorPorPontos: round2(valorPorPontos),
    bonusMilestone: bonus,
    totalComissao: round2(valorPorPontos + bonus),
    nivel: calcularNivel(paClampado),
  };
}

// Progresso até o próximo marco (0–100%). Em Excelência, fica em 100.
export function calcularProgresso(paTotal: number): number {
  if (paTotal >= 240) return 100;
  return Math.min(100, Math.max(0, Math.round((paTotal / 240) * 100)));
}

// Quanto falta pra próximo nível (null se já em Excelência)
export function paAteProximoNivel(paTotal: number): {
  proximo: Nivel | null;
  faltam: number | null;
} {
  if (paTotal < 80) return { proximo: "meta_1", faltam: 80 - paTotal };
  if (paTotal < 160) return { proximo: "meta_2", faltam: 160 - paTotal };
  if (paTotal < 240) return { proximo: "excelencia", faltam: 240 - paTotal };
  return { proximo: null, faltam: null };
}

export function formatBRL(n: number): string {
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function currentMesAno(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function mesAnoLabel(mesAno: string): string {
  const [y, m] = mesAno.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Labels e cores das funções
export type FuncaoCodigo =
  | "sdr"
  | "design"
  | "trafego"
  | "social_midia"
  | "video_maker"
  | "closer";

export const FUNCAO_LABEL: Record<FuncaoCodigo, string> = {
  sdr: "SDR",
  design: "Design",
  trafego: "Tráfego",
  social_midia: "Social Mídia",
  video_maker: "Video Maker",
  closer: "Closer",
};
