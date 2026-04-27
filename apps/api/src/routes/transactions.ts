import { Hono } from 'hono'
import { requireAuth, requireAdmin } from '../lib/clerk.js'
import { Transaction, User } from '@tradeup/db'

export const transactionRoutes = new Hono()

// ─── GET /api/transactions/me — auth ─────────────────────────────────────────
transactionRoutes.get('/me', requireAuth, async (c) => {
  const clerkId = c.get('userId')
  const { page = '1' } = c.req.query()
  const pageNum = Math.max(Number(page) || 1, 1)

  const user = await User.findOne({ clerkId })
  if (!user) return c.json({ error: 'User not synced' }, 400)

  const transactions = await Transaction.find({
    $or: [{ buyer: user._id }, { seller: user._id }],
  })
    .populate('offer')
    .populate('buyer', 'username')
    .populate('seller', 'username')
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * 20)
    .limit(20)

  const total = await Transaction.countDocuments({
    $or: [{ buyer: user._id }, { seller: user._id }],
  })

  return c.json({ transactions, total, page: pageNum })
})

// ─── GET /api/transactions — admin ───────────────────────────────────────────
transactionRoutes.get('/', requireAdmin, async (c) => {
  const { page = '1', status, type } = c.req.query()
  const pageNum = Math.max(Number(page) || 1, 1)

  const filter: Record<string, unknown> = {}
  if (status) filter['status'] = status
  if (type) filter['type'] = type

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .populate('buyer', 'username email')
      .populate('seller', 'username email')
      .populate('offer')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * 20)
      .limit(20),
    Transaction.countDocuments(filter),
  ])

  return c.json({ transactions, total, page: pageNum })
})

// ─── GET /api/transactions/:id — admin ───────────────────────────────────────
transactionRoutes.get('/:id', requireAdmin, async (c) => {
  const { id } = c.req.param()

  const transaction = await Transaction.findById(id)
    .populate('buyer', 'username email stripeConnectAccountId')
    .populate('seller', 'username email stripeConnectAccountId')
    .populate({
      path: 'offer',
      populate: [{ path: 'listing' }, { path: 'offeredCards' }],
    })

  if (!transaction) return c.json({ error: 'Transaction not found' }, 404)

  return c.json({ transaction })
})
