import { Hono } from 'hono'
import { requireAuth } from '../lib/clerk.js'
import { stripe, calculateCommission } from '../lib/stripe.js'
import { User, Listing } from '@tradeup/db'

export const paymentRoutes = new Hono()

/**
 * POST /api/payments/c2c-intent
 * Buyer creates a PaymentIntent hold when submitting a money/mixed offer.
 * Returns client_secret to complete with Stripe Elements on the frontend.
 */
paymentRoutes.post('/c2c-intent', requireAuth, async (c) => {
  const clerkId = c.get('userId')
  const { listingId, amount } = await c.req.json()

  if (!listingId || typeof amount !== 'number' || amount < 100) {
    return c.json({ error: 'listingId and amount (min 100 cents) are required' }, 400)
  }

  const buyer = await User.findOne({ clerkId })
  if (!buyer) return c.json({ error: 'User not synced' }, 400)
  if (buyer.isBanned) return c.json({ error: 'Account banned' }, 403)

  const listing = await Listing.findById(listingId)
  if (!listing) return c.json({ error: 'Listing not found' }, 404)
  if (listing.status !== 'active') return c.json({ error: 'Listing no longer active' }, 400)
  if (String(listing.seller) === String(buyer._id)) {
    return c.json({ error: 'Cannot pay for your own listing' }, 400)
  }

  const seller = await User.findById(listing.seller)
  if (!seller) return c.json({ error: 'Seller not found' }, 404)

  const commission = calculateCommission(amount)

  // If seller has Stripe connected, route payment directly
  const intentParams: any = {
    amount,
    currency: 'usd',
    capture_method: 'manual', // hold — captured when seller accepts
    metadata: {
      platform: 'tradeup',
      listingId,
      buyerMongoId: String(buyer._id),
      sellerMongoId: String(seller._id),
    },
  }

  if (seller.stripeConnectStatus === 'active' && seller.stripeConnectAccountId) {
    intentParams.transfer_data = { destination: seller.stripeConnectAccountId }
    intentParams.application_fee_amount = commission
  }

  const paymentIntent = await stripe.paymentIntents.create(intentParams)

  return c.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount,
    commission,
    sellerHasStripe: seller.stripeConnectStatus === 'active',
  })
})

/**
 * POST /api/payments/store-intent
 * Buyer purchases a StoreItem directly (immediate capture).
 */
paymentRoutes.post('/store-intent', requireAuth, async (c) => {
  const clerkId = c.get('userId')
  const { storeItemId } = await c.req.json()

  if (!storeItemId) return c.json({ error: 'storeItemId is required' }, 400)

  const buyer = await User.findOne({ clerkId })
  if (!buyer) return c.json({ error: 'User not synced' }, 400)

  // Dynamic import to avoid circular deps
  const { StoreItem } = await import('@tradeup/db')
  const item = await StoreItem.findById(storeItemId).populate('catalogCard')
  if (!item) return c.json({ error: 'Item not found' }, 404)
  if (!item.isActive || item.stock < 1) return c.json({ error: 'Item out of stock' }, 400)

  const commission = calculateCommission(item.price)

  const paymentIntent = await stripe.paymentIntents.create({
    amount: item.price,
    currency: 'usd',
    capture_method: 'automatic',
    metadata: {
      platform: 'tradeup',
      storeItemId,
      buyerMongoId: String(buyer._id),
      type: 'store_purchase',
    },
    application_fee_amount: commission,
  })

  return c.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount: item.price,
    commission,
    itemName: (item.catalogCard as any)?.name ?? 'Item',
  })
})
