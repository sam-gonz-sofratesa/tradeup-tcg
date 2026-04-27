import { Hono } from 'hono'
import { z } from 'zod'
import { bodyLimit } from 'hono/body-limit'
import { requireAuth, requireAdmin } from '../lib/clerk.js'
import { stripe, calculateCommission } from '../lib/stripe.js'
import { StoreItem, CatalogCard, User, Transaction } from '@tradeup/db'
import { saveFile } from '../lib/storage.js'

export const storeRoutes = new Hono()

const storeItemSchema = z.object({
  catalogCardId: z.string().min(24),
  condition: z.string().min(1),
  price: z.number().int().positive(),
  stock: z.number().int().min(1).default(1),
  isGraded: z.boolean().default(false),
  gradeValue: z.number().optional(),
  gradeCompany: z.string().optional(),
  isSealed: z.boolean().default(false),
})

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_PHOTOS = 5

// ─── GET /api/store ───────────────────────────────────────────────────────────
storeRoutes.get('/', async (c) => {
  const { page = '1', limit = '20', game } = c.req.query()
  const pageNum = Math.max(Number(page) || 1, 1)
  const limitNum = Math.min(Number(limit) || 20, 50)

  const items = await StoreItem.find({ isActive: true, stock: { $gt: 0 } })
    .populate({
      path: 'catalogCard',
      ...(game ? { match: { game } } : {}),
    })
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)

  const filtered = items.filter((i) => i.catalogCard !== null)
  const total = await StoreItem.countDocuments({ isActive: true, stock: { $gt: 0 } })

  return c.json({ items: filtered, total, page: pageNum, limit: limitNum })
})

// ─── GET /api/store/:id ───────────────────────────────────────────────────────
storeRoutes.get('/:id', async (c) => {
  const item = await StoreItem.findById(c.req.param('id')).populate('catalogCard')
  if (!item) return c.json({ error: 'Item not found' }, 404)
  return c.json({ item })
})

// ─── POST /api/store/:id/buy ──────────────────────────────────────────────────
storeRoutes.post('/:id/buy', requireAuth, async (c) => {
  const clerkId = c.get('userId')
  const { id } = c.req.param()

  const buyer = await User.findOne({ clerkId })
  if (!buyer) return c.json({ error: 'User not synced' }, 400)
  if (buyer.isBanned) return c.json({ error: 'Account banned' }, 403)

  const item = await StoreItem.findById(id)
  if (!item || !item.isActive) return c.json({ error: 'Item not found or unavailable' }, 404)
  if (item.stock < 1) return c.json({ error: 'Out of stock' }, 400)

  // B2C: direct charge, TradeUp is the merchant (no Stripe Connect needed)
  const pi = await stripe.paymentIntents.create({
    amount: item.price,
    currency: 'usd',
    metadata: {
      platform: 'tradeup',
      type: 'b2c',
      storeItemId: String(item._id),
      buyerClerkId: clerkId,
    },
  })

  // Create a pending transaction; webhook will complete it
  await Transaction.create({
    buyer: buyer._id,
    seller: buyer._id, // placeholder — TradeUp is seller in B2C
    type: 'b2c',
    grossAmount: item.price,
    commissionAmount: 0, // no commission on own store
    netAmount: item.price,
    stripePaymentIntentId: pi.id,
    status: 'pending',
    reviewEligible: false,
  })

  return c.json({
    message: 'Payment initiated',
    clientSecret: pi.client_secret,
    amount: item.price,
  })
})

// ─── POST /api/store — admin ──────────────────────────────────────────────────
storeRoutes.post(
  '/',
  requireAdmin,
  bodyLimit({ maxSize: 15 * 1024 * 1024, onError: (c) => c.json({ error: 'Payload too large' }, 413) }),
  async (c) => {
    const body = await c.req.parseBody({ all: true })

    const parsed = storeItemSchema.safeParse({
      catalogCardId: body['catalogCardId'],
      condition: body['condition'],
      price: Number(body['price']),
      stock: Number(body['stock'] ?? 1),
      isGraded: body['isGraded'] === 'true',
      gradeValue: body['gradeValue'] ? Number(body['gradeValue']) : undefined,
      gradeCompany: body['gradeCompany'] as string | undefined,
      isSealed: body['isSealed'] === 'true',
    })

    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400)
    }

    const catalogCard = await CatalogCard.findById(parsed.data.catalogCardId)
    if (!catalogCard) return c.json({ error: 'Catalog card not found' }, 404)

    const photoField = body['photos']
    const files: File[] = Array.isArray(photoField)
      ? photoField.filter((f): f is File => f instanceof File)
      : photoField instanceof File ? [photoField] : []

    if (files.length > MAX_PHOTOS) {
      return c.json({ error: `Maximum ${MAX_PHOTOS} photos allowed` }, 400)
    }

    const badType = files.find((f) => !ALLOWED_MIME_TYPES.includes(f.type))
    if (badType) return c.json({ error: `Invalid file type: ${badType.type}` }, 400)

    const photoPaths = await Promise.all(files.map((f) => saveFile(f)))

    const item = await StoreItem.create({
      catalogCard: catalogCard._id,
      condition: parsed.data.condition,
      photos: photoPaths,
      price: parsed.data.price,
      stock: parsed.data.stock,
      isGraded: parsed.data.isGraded,
      gradeValue: parsed.data.gradeValue,
      gradeCompany: parsed.data.gradeCompany,
      isSealed: parsed.data.isSealed,
      isActive: true,
    })

    return c.json({ message: 'Store item created', item }, 201)
  }
)

// ─── PATCH /api/store/:id — admin ─────────────────────────────────────────────
storeRoutes.patch('/:id', requireAdmin, async (c) => {
  const { id } = c.req.param()
  const body = await c.req.json()

  const item = await StoreItem.findByIdAndUpdate(id, { $set: body }, { new: true, runValidators: true })
  if (!item) return c.json({ error: 'Item not found' }, 404)

  return c.json({ message: 'Store item updated', item })
})

// ─── DELETE /api/store/:id — admin (soft delete) ──────────────────────────────
storeRoutes.delete('/:id', requireAdmin, async (c) => {
  const { id } = c.req.param()
  const item = await StoreItem.findByIdAndUpdate(id, { isActive: false }, { new: true })
  if (!item) return c.json({ error: 'Item not found' }, 404)
  return c.json({ message: 'Store item deactivated' })
})
