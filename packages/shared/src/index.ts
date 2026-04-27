// Shared constants
export const TCG_GAMES = ['pokemon', 'yugioh', 'onepiece', 'dragonball', 'mtg', 'other'] as const
export const CARD_CONDITIONS = ['mint', 'near_mint', 'excellent', 'good', 'played', 'poor'] as const
export const OFFER_EXPIRY_HOURS = 72
export const PLATFORM_COMMISSION = 0.08  // 8%

export type TCGGame = typeof TCG_GAMES[number]
export type CardCondition = typeof CARD_CONDITIONS[number]

// Shared utility
export function centsToUSD(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export function calculateCommission(amountCents: number): number {
  return Math.round(amountCents * PLATFORM_COMMISSION)
}

export function getOfferExpiryDate(): Date {
  const d = new Date()
  d.setHours(d.getHours() + OFFER_EXPIRY_HOURS)
  return d
}
