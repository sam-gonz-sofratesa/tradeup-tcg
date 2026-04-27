import { Hono } from 'hono'
import { z } from 'zod'
import { bodyLimit } from 'hono/body-limit'
import { requireAuth, requireAdmin } from '../lib/clerk.js'
import { stripe } from '../lib/stripe.js'
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
  const {
    page = '1',
    limit = '20',
    game,
    condition,
    minPrice,
    maxPrice,
    graded,       // 'true' | 'false'
    q,            // text search
    sort = 'newest', // newest | oldest | price_asc | price_desc
  } = c.req.query()

  const pageNum = Math.max(Number(page) || 1, 1)
  const limitNum = Math.min(Number(limit) || 20, 50)

  // Build catalogCard match for game + text search
  const cardMatch: Record<string, unknown> = {}
  if (game) cardMatch['game'] = game
  if (q) cardMatch['name'] = { $regex: q.trim(), $options: 'i' }

  // Build StoreItem filter
  const itemFilter: Record<string, unknown> = { isActive: true, stock: { $gt: 0 } }
  if (condition) itemFilter['condition'] = condition
  if (graded === 'true') itemFilter['isGraded'] = true
  if (graded === 'false') itemFilter['isGraded'] = { $ne: true }
  if (minPrice || maxPrice) {
    const priceFilter: Record<string, number> = {}
    if (minPrice) priceFilter['$gte'] = Number(minPrice)
    if (maxPrice) priceFilter['$lte'] = Number(maxPrice)
    itemFilter['price'] = priceFilter
  }

  // Sort
  const sortMap: Record<string, Record<string, 1 | -1>> = {
    newest:     { createdAt: -1 },
    oldest:     { createdAt:  1 },
    price_asc:  { price:  1 },
    price_desc: { price: -1 },
  }
  const sortObj = sortMap[sort] ?? sortMap['newest']

  // Fetch with populated catalogCard
  const allItems = await StoreItem.find(itemFilter)
    .populate({ path: 'catalogCard', match: Object.keys(cardMatch).length ? cardMatch : undefined })
    .sort(sortObj)

  // Filter out items where catalogCard didn't match
  const filtered = allItems.filter((i) => i.catalogCard !== null)

  const total = filtered.length
  const paginated = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum)

  return c.json({ items: paginated, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) })
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

  const item = await StoreItem.findById(id).populate('catalogCard')
  if (!item || !item.isActive) return c.json({ error: 'Item not found or unavailable' }, 404)
  if (item.stock < 1) return c.json({ error: 'Out of stock' }, 400)

  const card = item.catalogCard as any

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

  await Transaction.create({
    buyer: buyer._id,
    seller: null,
    isBuyerPurchase: true,
    type: 'b2c',
    grossAmount: item.price,
    commissionAmount: 0,
    netAmount: item.price,
    stripePaymentIntentId: pi.id,
    status: 'pending',
    shippingStatus: 'pending',
    reviewEligible: false,
    storeItemSnapshot: {
      name: card?.name,
      imageUrl: card?.imageUrl,
      condition: item.condition,
      set: card?.set,
      storeItemId: String(item._id),
    },
  })

  return c.json({ message: 'Payment initiated', clientSecret: pi.client_secret, amount: item.price })
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

    if (files.length > MAX_PHOTOS) return c.json({ error: `Maximum ${MAX_PHOTOS} photos allowed` }, 400)
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

// ─── DELETE /api/store/:id — admin ───────────────────────────────────────────
storeRoutes.delete('/:id', requireAdmin, async (c) => {
  const { id } = c.req.param()
  const item = await StoreItem.findByIdAndUpdate(id, { isActive: false }, { new: true })
  if (!item) return c.json({ error: 'Item not found' }, 404)
  return c.json({ message: 'Store item deactivated' })
})
