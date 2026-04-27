import { Hono } from 'hono'
import { requireAuth } from '../lib/clerk.js'

export const userRoutes = new Hono()

// GET /api/users/:id/profile — public
userRoutes.get('/:id/profile', async (c) => {
  return c.json({ user: null, reviews: [], listings: [] })
})

// POST /api/users/:id/review — auth, post-transaction only
userRoutes.post('/:id/review', requireAuth, async (c) => {
  return c.json({ message: 'review submitted' }, 201)
})

// GET /api/users/me/dashboard — auth
userRoutes.get('/me/dashboard', requireAuth, async (c) => {
  return c.json({ listings: [], offersReceived: [], offersSent: [], transactions: [] })
})

// POST /api/users/me/stripe-onboard — redirect to Stripe Connect onboarding
userRoutes.post('/me/stripe-onboard', requireAuth, async (c) => {
  // TODO: create or retrieve Stripe Connect account, generate account link
  return c.json({ onboardingUrl: null })
})
