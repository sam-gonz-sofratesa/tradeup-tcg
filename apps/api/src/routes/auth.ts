import { Hono } from 'hono'
import { requireAuth } from '../lib/clerk.js'

export const authRoutes = new Hono()

// Sync Clerk user to our MongoDB Users collection on first sign-in
authRoutes.post('/sync', requireAuth, async (c) => {
  const userId = c.get('userId')
  // TODO: upsert User document with clerkId, default role: buyer
  return c.json({ message: 'user synced', userId })
})
