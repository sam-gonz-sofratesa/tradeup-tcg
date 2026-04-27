import { Hono } from 'hono'
import { stripe } from '../lib/stripe.js'

export const webhookRoutes = new Hono()

// Stripe webhook handler
webhookRoutes.post('/stripe', async (c) => {
  const signature = c.req.header('stripe-signature')
  const body = await c.req.text()

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature ?? '',
      process.env['STRIPE_WEBHOOK_SECRET'] ?? ''
    )
  } catch (err) {
    return c.json({ error: 'Webhook signature verification failed' }, 400)
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      // TODO: finalize transaction, unlock reviews
      break
    case 'payment_intent.payment_failed':
      // TODO: revert offer to failed state
      break
    case 'account.updated':
      // TODO: update user's stripeConnectStatus in MongoDB
      break
    default:
      console.log(`Unhandled Stripe event: ${event.type}`)
  }

  return c.json({ received: true })
})
