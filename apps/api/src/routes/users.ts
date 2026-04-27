import { Hono } from 'hono'
import { z } from 'zod'
import { requireAuth } from '../lib/clerk.js'
import { stripe } from '../lib/stripe.js'
import { User, Listing, Review, Transaction, Offer } from '@tradeup/db'

export const userRoutes = new Hono()

const reviewSchema = z.object({
  transactionId: z.string().min(24),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
})

// ─── GET /api/users/me/dashboard — auth ──────────────────────────────────────
// IMPORTANT: static /me routes must be declared BEFORE /:id
userRoutes.get('/me/dashboard', requireAuth, async (c) => {
  const clerkId = c.get('userId')
  const user = await User.findOne({ clerkId })
  if (!user) return c.json({ error: 'User not synced' }, 400)

  const [listings, offersReceived, offersSent, transactions] = await Promise.all([
    Listing.find({ seller: user._id }).populate('catalogCard').sort({ createdAt: -1 }).limit(20),
    Offer.find({ seller: user._id, status: 'pending' }).populate('listing').populate('buyer', 'username reputation').limit(20),
    Offer.find({ buyer: user._id }).populate('listing').populate('seller', 'username reputation').sort({ createdAt: -1 }).limit(20),
    Transaction.find({ $or: [{ buyer: user._id }, { seller: user._id }] }).sort({ createdAt: -1 }).limit(20),
  ])

  return c.json({
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      reputation: user.reputation,
      reviewCount: user.reviewCount,
      stripeConnectStatus: user.stripeConnectStatus,
    },
    listings,
    offersReceived,
    offersSent,
    transactions,
  })
})

// ─── POST /api/users/me/stripe-onboard ───────────────────────────────────────
userRoutes.post('/me/stripe-onboard', requireAuth, async (c) => {
  const clerkId = c.get('userId')
  const user = await User.findOne({ clerkId })
  if (!user) return c.json({ error: 'User not synced' }, 400)

  let accountId = user.stripeConnectAccountId

  // Create a Stripe Express account if the user doesn't have one yet
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      email: user.email,
      metadata: { clerkId, mongoUserId: String(user._id) },
    })
    accountId = account.id
    await User.findByIdAndUpdate(user._id, {
      stripeConnectAccountId: accountId,
      stripeConnectStatus: 'pending',
    })
  }

  // Create an Account Link (single-use, expires quickly)
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env['CORS_ORIGIN'] ?? 'http://localhost:3000'}/dashboard?stripe=refresh`,
    return_url: `${process.env['CORS_ORIGIN'] ?? 'http://localhost:3000'}/dashboard?stripe=success`,
    type: 'account_onboarding',
  })

  return c.json({ onboardingUrl: accountLink.url })
})

// ─── GET /api/users/:id/profile — public ─────────────────────────────────────
userRoutes.get('/:id/profile', async (c) => {
  const { id } = c.req.param()

  const user = await User.findById(id).select('username reputation reviewCount createdAt')
  if (!user) return c.json({ error: 'User not found' }, 404)

  const [listings, reviews] = await Promise.all([
    Listing.find({ seller: user._id, status: 'active' })
      .populate('catalogCard')
      .sort({ createdAt: -1 })
      .limit(12),
    Review.find({ reviewee: user._id })
      .populate('reviewer', 'username')
      .sort({ createdAt: -1 })
      .limit(10),
  ])

  return c.json({ user, listings, reviews })
})

// ─── POST /api/users/:id/review — auth ───────────────────────────────────────
userRoutes.post('/:id/review', requireAuth, async (c) => {
  const { id: revieweeMongoId } = c.req.param()
  const clerkId = c.get('userId')
  const body = await c.req.json()

  const parsed = reviewSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400)
  }

  const reviewer = await User.findOne({ clerkId })
  if (!reviewer) return c.json({ error: 'User not synced' }, 400)

  if (String(reviewer._id) === revieweeMongoId) {
    return c.json({ error: 'You cannot review yourself' }, 400)
  }

  // Verify transaction exists and reviewer was a party
  const transaction = await Transaction.findById(parsed.data.transactionId)
  if (!transaction) return c.json({ error: 'Transaction not found' }, 404)
  if (!transaction.reviewEligible) return c.json({ error: 'Transaction not eligible for review yet' }, 400)

  const isParty =
    String(transaction.buyer) === String(reviewer._id) ||
    String(transaction.seller) === String(reviewer._id)
  if (!isParty) return c.json({ error: 'You were not part of this transaction' }, 403)

  // Check for duplicate review
  const existing = await Review.findOne({
    transaction: transaction._id,
    reviewer: reviewer._id,
  })
  if (existing) return c.json({ error: 'You already reviewed this transaction' }, 409)

  const review = await Review.create({
    transaction: transaction._id,
    reviewer: reviewer._id,
    reviewee: revieweeMongoId,
    rating: parsed.data.rating,
    comment: parsed.data.comment,
  })

  // Update reviewee reputation (rolling average)
  const reviewee = await User.findById(revieweeMongoId)
  if (reviewee) {
    const newCount = reviewee.reviewCount + 1
    const newReputation =
      Math.round(((reviewee.reputation * reviewee.reviewCount + parsed.data.rating) / newCount) * 10) / 10
    await User.findByIdAndUpdate(revieweeMongoId, {
      reputation: newReputation,
      reviewCount: newCount,
    })
  }

  return c.json({ message: 'Review submitted', review }, 201)
})
