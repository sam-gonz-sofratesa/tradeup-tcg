import { Hono } from 'hono'
import { requireAuth } from '../lib/clerk.js'
import { User, Offer, Transaction } from '@tradeup/db'

export const notificationRoutes = new Hono()

/**
 * GET /api/notifications/summary
 * Returns counts for the navbar badge:
 *  - pendingOffers: offers received waiting for response
 *  - pendingOrders: B2C orders in non-completed state
 */
notificationRoutes.get('/summary', requireAuth, async (c) => {
  const clerkId = c.get('userId')

  const user = await User.findOne({ clerkId })
  if (!user) return c.json({ error: 'User not synced' }, 400)

  const [pendingOffers, pendingOrders] = await Promise.all([
    Offer.countDocuments({ listing: { $in: [] }, status: 'pending', seller: user._id }),
    Transaction.countDocuments({ buyer: user._id, status: 'pending', isBuyerPurchase: true }),
  ])

  return c.json({ pendingOffers, pendingOrders, total: pendingOffers + pendingOrders })
})
