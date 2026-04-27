import { Hono } from 'hono'
import { requireAuth, requireAdmin } from '../lib/clerk.js'
import { Transaction, User, Review } from '@tradeup/db'

export const transactionRoutes = new Hono()

// ─── GET /api/transactions/me ──────────────────────────────────────────────
transactionRoutes.get('/me', requireAuth, async (c) => {
  const clerkId = c.get('userId')
  const { page = '1', type } = c.req.query()
  const pageNum = Math.max(Number(page) || 1, 1)

  const user = await User.findOne({ clerkId })
  if (!user) return c.json({ error: 'User not synced' }, 400)

  const filter: Record<string, unknown> = {
    $or: [{ buyer: user._id }, { seller: user._id }],
  }
  if (type) filter['type'] = type

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .populate('offer')
      .populate('buyer', 'username')
      .populate('seller', 'username')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * 20)
      .limit(20),
    Transaction.countDocuments(filter),
  ])

  return c.json({ transactions, total, page: pageNum })
})

// ─── GET /api/transactions/:id — detalle para el dueño ──────────────────────
transactionRoutes.get('/:id', requireAuth, async (c) => {
  const clerkId = c.get('userId')
  const { id } = c.req.param()

  const user = await User.findOne({ clerkId })
  if (!user) return c.json({ error: 'User not synced' }, 400)

  const transaction = await Transaction.findById(id)
    .populate('buyer', 'username')
    .populate('seller', 'username')
    .populate({ path: 'offer', populate: [{ path: 'listing', populate: { path: 'catalogCard' } }] })

  if (!transaction) return c.json({ error: 'Not found' }, 404)

  // Only buyer or seller can view
  const isBuyer = String(transaction.buyer._id ?? transaction.buyer) === String(user._id)
  const isSeller = transaction.seller && String((transaction.seller as any)._id ?? transaction.seller) === String(user._id)
  if (!isBuyer && !isSeller) return c.json({ error: 'Forbidden' }, 403)

  // Check if current user already left a review
  const myReview = await Review.findOne({ transaction: id, reviewer: user._id })

  return c.json({ transaction, myReview: myReview ?? null })
})

// ─── POST /api/transactions/:id/review ─────────────────────────────────
transactionRoutes.post('/:id/review', requireAuth, async (c) => {
  const clerkId = c.get('userId')
  const { id } = c.req.param()
  const { rating, comment } = await c.req.json()

  if (!rating || rating < 1 || rating > 5) return c.json({ error: 'rating must be 1-5' }, 400)

  const user = await User.findOne({ clerkId })
  if (!user) return c.json({ error: 'User not synced' }, 400)

  const transaction = await Transaction.findById(id)
  if (!transaction) return c.json({ error: 'Not found' }, 404)
  if (!transaction.reviewEligible) return c.json({ error: 'Transaction not eligible for review' }, 400)

  const isBuyer = String(transaction.buyer) === String(user._id)
  const isSeller = transaction.seller && String(transaction.seller) === String(user._id)
  if (!isBuyer && !isSeller) return c.json({ error: 'Forbidden' }, 403)

  // Reviewee is the other party
  const revieweeId = isBuyer ? transaction.seller : transaction.buyer
  if (!revieweeId) return c.json({ error: 'No reviewee for B2C transaction' }, 400)

  const existing = await Review.findOne({ transaction: id, reviewer: user._id })
  if (existing) return c.json({ error: 'Already reviewed' }, 409)

  const review = await Review.create({
    transaction: id,
    reviewer: user._id,
    reviewee: revieweeId,
    rating,
    comment: comment?.trim()?.slice(0, 500),
  })

  // Update reviewee reputation
  const reviews = await Review.find({ reviewee: revieweeId })
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
  await User.findByIdAndUpdate(revieweeId, {
    reputation: Math.round(avg * 10) / 10,
    reviewCount: reviews.length,
  })

  return c.json({ review }, 201)
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
