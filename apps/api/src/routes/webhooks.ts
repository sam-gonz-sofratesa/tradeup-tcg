import { Hono } from 'hono'
import { stripe } from '../lib/stripe.js'
import { Transaction, User, StoreItem } from '@tradeup/db'

export const webhookRoutes = new Hono()

/**
 * POST /webhooks/stripe
 *
 * Stripe sends events here. Raw body is required for signature verification,
 * so this route must be mounted BEFORE any JSON body parsers.
 *
 * Key events handled:
 *  - payment_intent.succeeded   → complete B2C transaction, reduce stock
 *  - payment_intent.canceled    → mark transaction failed (offer expired/declined)
 *  - payment_intent.payment_failed → mark transaction failed
 *  - account.updated            → sync Stripe Connect status to User
 */
webhookRoutes.post('/stripe', async (c) => {
  const signature = c.req.header('stripe-signature')
  const rawBody = await c.req.text()
  const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET']

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured')
    return c.json({ error: 'Webhook not configured' }, 500)
  }

  let event: ReturnType<typeof stripe.webhooks.constructEvent>

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature ?? '', webhookSecret)
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err)
    return c.json({ error: 'Invalid signature' }, 400)
  }

  try {
    switch (event.type) {

      // ── B2C purchase completed ──────────────────────────────────────────────
      case 'payment_intent.succeeded': {
        const pi = event.data.object
        const { type, storeItemId } = pi.metadata

        if (type === 'b2c' && storeItemId) {
          // Reduce stock
          await StoreItem.findByIdAndUpdate(storeItemId, { $inc: { stock: -1 } })
          // Complete the transaction
          await Transaction.findOneAndUpdate(
            { stripePaymentIntentId: pi.id },
            { status: 'completed' }
          )
        } else {
          // C2C money transaction — already captured in accept flow,
          // but mark completed in case of async capture confirmation
          await Transaction.findOneAndUpdate(
            { stripePaymentIntentId: pi.id, status: 'pending' },
            { status: 'completed', reviewEligible: true }
          )
        }
        break
      }

      // ── Payment failed ──────────────────────────────────────────────────────
      case 'payment_intent.payment_failed': {
        const pi = event.data.object
        await Transaction.findOneAndUpdate(
          { stripePaymentIntentId: pi.id },
          { status: 'failed' }
        )
        console.warn(`PaymentIntent ${pi.id} failed:`, pi.last_payment_error?.message)
        break
      }

      // ── Payment intent cancelled (offer declined / expired) ─────────────────
      case 'payment_intent.canceled': {
        const pi = event.data.object
        await Transaction.findOneAndUpdate(
          { stripePaymentIntentId: pi.id },
          { status: 'failed' }
        )
        break
      }

      // ── Stripe Connect account updated ──────────────────────────────────────
      case 'account.updated': {
        const account = event.data.object
        const isActive =
          account.charges_enabled &&
          account.details_submitted &&
          account.payouts_enabled

        await User.findOneAndUpdate(
          { stripeConnectAccountId: account.id },
          {
            stripeConnectStatus: isActive ? 'active' : 'pending',
          }
        )
        console.log(`Stripe Connect account ${account.id} status: ${isActive ? 'active' : 'pending'}`)
        break
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`)
    }
  } catch (err) {
    console.error(`Error processing Stripe event ${event.type}:`, err)
    // Still return 200 so Stripe doesn't retry — log and handle manually
  }

  return c.json({ received: true })
})
