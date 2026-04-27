import { Hono } from 'hono'
import { requireAuth, requireAdmin } from '../lib/clerk.js'

export const storeRoutes = new Hono()

// Public: browse B2C store
storeRoutes.get('/', async (c) => {
  return c.json({ items: [] })
})

storeRoutes.get('/:id', async (c) => {
  return c.json({ item: null })
})

// B2C purchase — auth required
storeRoutes.post('/:id/buy', requireAuth, async (c) => {
  // TODO: Stripe PaymentIntent direct charge (no Connect, TradeUp is seller)
  return c.json({ message: 'purchase initiated', clientSecret: null })
})

// Admin CRUD
storeRoutes.post('/', requireAdmin, async (c) => {
  return c.json({ message: 'store item created' }, 201)
})

storeRoutes.patch('/:id', requireAdmin, async (c) => {
  return c.json({ message: 'store item updated' })
})

storeRoutes.delete('/:id', requireAdmin, async (c) => {
  return c.json({ message: 'store item deleted' })
})
