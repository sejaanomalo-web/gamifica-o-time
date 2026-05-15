// Valores permitidos de gift card. Fonte ÚNICA usada por:
// - UI da loja (/pa/loja) — renderiza os botões nessa ordem
// - API POST /api/pa/loja — valida o body contra essa lista
//
// Mudar aqui propaga pro cliente e servidor. Resgates já registrados
// no banco com valores antigos continuam intactos (não tocamos
// histórico ao trocar a lista).
//
// Custo: 1 PA = R$1. Então valorReais === paGasto.

export const VALORES_GIFT_CARD = [80, 150, 200, 250, 300, 350, 400, 450, 500] as const;

export type ValorGiftCard = (typeof VALORES_GIFT_CARD)[number];

export function isValorGiftCard(v: number): v is ValorGiftCard {
  return (VALORES_GIFT_CARD as readonly number[]).includes(v);
}
