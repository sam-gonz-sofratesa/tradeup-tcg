import Stripe from 'stripe'

export const stripe = new Stripe(process.env['STRIPE_SECRET_KEY'] ?? '', {
  apiVersion: '2024-04-10',
  typescript: true,
})

/** Calculate commission: TradeUp takes 8% from seller on money transactions */
export function calculateCommission(amount: number): number {
  return Math.round(amount * 0.08)
}

/** Create a PaymentIntent with hold (manual capture) for offer reservation */
export async function createPaymentIntentHold(amount: number, sellerId: string) {
  return stripe.paymentIntents.create({
    amount,          // in cents
    currency: 'usd',
    capture_method: 'manual',
    transfer_data: {
      destination: sellerId,
    },
    application_fee_amount: calculateCommission(amount),
    metadata: { platform: 'tradeup' },
  })
}
