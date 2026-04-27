import { Hono } from 'hono'
import { requireAdmin } from '../lib/clerk.js'

export const adminRoutes = new Hono()

// Dashboard metrics
adminRoutes.get('/metrics', requireAdmin, async (c) => {
  // TODO: aggregate transactions, revenue, active users count
  return c.json({
    totalTransactions: 0,
    totalRevenue: 0,
    activeUsers: 0,
    pendingOffers: 0,
  })
})

// User management
adminRoutes.get('/users', requireAdmin, async (c) => {
  return c.json({ users: [], total: 0 })
})

adminRoutes.patch('/users/:id/ban', requireAdmin, async (c) => {
  return c.json({ message: 'user banned' })
})

adminRoutes.patch('/users/:id/role', requireAdmin, async (c) => {
  // TODO: update role via Clerk API + MongoDB
  return c.json({ message: 'role updated' })
})
