import { Hono } from 'hono'
import { requireAuth } from '../lib/clerk.js'

export const offerRoutes = new Hono()

// GET /api/offers — auth, returns user's sent and received offers
offerRoutes.get('/', requireAuth, async (c) => {
  return c.json({ sent: [], received: [] })
})

// POST /api/offers — create offer (money, cards, or mixed)
offerRoutes.post('/', requireAuth, async (c) => {
  // TODO:
  // 1. Validate offer data
  // 2. If money involved, create Stripe PaymentIntent (manual capture)
  // 3. Check if seller has Stripe Connect — if not, flag for onboarding redirect
  // 4. Save Offer document with status: 'pending', expiresAt: +72h
  return c.json({ message: 'offer created', offer: null }, 201)
})

// POST /api/offers/:id/accept — seller accepts offer
offerRoutes.post('/:id/accept', requireAuth, async (c) => {
  // TODO:
  // 1. Verify user is listing owner
  // 2. Check seller has Stripe Connect (if money involved)
  // 3. Capture PaymentIntent
  // 4. Mark offer as accepted, listing as traded/sold
  // 5. Create Transaction record
  return c.json({ message: 'offer accepted' })
})

// POST /api/offers/:id/decline — seller declines
offerRoutes.post('/:id/decline', requireAuth, async (c) => {
  // TODO: Cancel PaymentIntent if exists, update offer status
  return c.json({ message: 'offer declined' })
})

// POST /api/offers/:id/cancel — buyer cancels before response
offerRoutes.post('/:id/cancel', requireAuth, async (c) => {
  return c.json({ message: 'offer cancelled' })
})
