import { Hono } from 'hono'
import { requireAuth, requireAdmin } from '../lib/clerk.js'

export const transactionRoutes = new Hono()

// User: their own transaction history
transactionRoutes.get('/me', requireAuth, async (c) => {
  return c.json({ transactions: [] })
})

// Admin: all transactions
transactionRoutes.get('/', requireAdmin, async (c) => {
  return c.json({ transactions: [], total: 0 })
})

transactionRoutes.get('/:id', requireAdmin, async (c) => {
  return c.json({ transaction: null })
})
