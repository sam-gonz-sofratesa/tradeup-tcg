import { Hono } from 'hono'
import { requireAuth } from '../lib/clerk.js'
import { stripe, calculateCommission } from '../lib/stripe.js'
import { User, Listing, StoreItem, Transaction } from '@tradeup/db'

export const paymentRoutes = new Hono()

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

  const intentParams: any = {
    amount,
    currency: 'usd',
    capture_method: 'manual',
    metadata: {
      platform: 'tradeup',
      type: 'c2c',
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
 * B2C — seller is null (TradeUp is merchant), isBuyerPurchase = true
 */
paymentRoutes.post('/store-intent', requireAuth, async (c) => {
  const clerkId = c.get('userId')
  const { storeItemId } = await c.req.json()

  if (!storeItemId) return c.json({ error: 'storeItemId is required' }, 400)

  const buyer = await User.findOne({ clerkId })
  if (!buyer) return c.json({ error: 'User not synced' }, 400)
  if (buyer.isBanned) return c.json({ error: 'Account banned' }, 403)

  const item = await StoreItem.findById(storeItemId).populate('catalogCard')
  if (!item) return c.json({ error: 'Item not found' }, 404)
  if (!item.isActive || item.stock < 1) return c.json({ error: 'Item out of stock' }, 400)

  const card = item.catalogCard as any

  const paymentIntent = await stripe.paymentIntents.create({
    amount: item.price,
    currency: 'usd',
    capture_method: 'automatic',
    metadata: {
      platform: 'tradeup',
      type: 'store_purchase',
      storeItemId,
      buyerMongoId: String(buyer._id),
    },
  })

  // seller = null, isBuyerPurchase = true, snapshot of item for order detail
  await Transaction.create({
    buyer: buyer._id,
    seller: null,
    isBuyerPurchase: true,
    type: 'b2c',
    grossAmount: item.price,
    stripePaymentIntentId: paymentIntent.id,
    status: 'pending',
    shippingStatus: 'pending',
    storeItemSnapshot: {
      name: card?.name,
      imageUrl: card?.imageUrl,
      condition: item.condition,
      set: card?.set,
      storeItemId: String(item._id),
    },
  })

  return c.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount: item.price,
    itemName: card?.name ?? 'Item',
  })
})
