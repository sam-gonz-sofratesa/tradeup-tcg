import { Hono } from 'hono'
import { z } from 'zod'
import { requireAuth, requireAdmin } from '../lib/clerk.js'
import { CatalogCard, CatalogRequest, User } from '@tradeup/db'

export const catalogRoutes = new Hono()

const TCG_GAMES = ['pokemon', 'yugioh', 'onepiece', 'dragonball', 'mtg', 'other'] as const
const RARITIES = ['common', 'uncommon', 'rare', 'super_rare', 'ultra_rare', 'secret_rare', 'promo', 'other'] as const

const cardSchema = z.object({
  game: z.enum(TCG_GAMES),
  name: z.string().min(1).max(200),
  set: z.string().min(1).max(200),
  setCode: z.string().min(1).max(50),
  cardNumber: z.string().min(1).max(50),
  rarity: z.enum(RARITIES),
  imageUrl: z.string().url().optional(),
  language: z.string().default('en'),
})

const requestSchema = z.object({
  game: z.string().min(1),
  name: z.string().min(1).max(200),
  set: z.string().min(1).max(200),
  cardNumber: z.string().min(1).max(50),
  rarity: z.string().min(1),
  notes: z.string().max(500).optional(),
})

// ─── GET /api/catalog/search ─────────────────────────────────────────────────
// IMPORTANT: static routes must come before dynamic /:id
catalogRoutes.get('/search', async (c) => {
  const { q, game, page = '1', limit = '20' } = c.req.query()

  if (!q || q.trim().length < 2) {
    return c.json({ error: 'Query must be at least 2 characters' }, 400)
  }

  const pageNum = Math.max(Number(page) || 1, 1)
  const limitNum = Math.min(Number(limit) || 20, 50)

  const filter: Record<string, unknown> = {
    $text: { $search: q },
  }
  if (game && TCG_GAMES.includes(game as typeof TCG_GAMES[number])) {
    filter['game'] = game
  }

  const cards = await CatalogCard.find(filter)
    .sort({ score: { $meta: 'textScore' } })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)

  const total = await CatalogCard.countDocuments(filter)

  return c.json({ cards, total, page: pageNum, limit: limitNum })
})

// ─── GET /api/catalog/requests — admin ───────────────────────────────────────
catalogRoutes.get('/requests', requireAdmin, async (c) => {
  const { status = 'pending', page = '1' } = c.req.query()
  const pageNum = Math.max(Number(page) || 1, 1)

  const requests = await CatalogRequest.find({ status })
    .populate('requestedBy', 'username email')
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * 20)
    .limit(20)

  const total = await CatalogRequest.countDocuments({ status })
  return c.json({ requests, total, page: pageNum })
})

// ─── PATCH /api/catalog/requests/:id/approve — admin ─────────────────────────
catalogRoutes.patch('/requests/:id/approve', requireAdmin, async (c) => {
  const { id } = c.req.param()

  const request = await CatalogRequest.findById(id)
  if (!request) return c.json({ error: 'Request not found' }, 404)
  if (request.status !== 'pending') {
    return c.json({ error: `Request is already ${request.status}` }, 400)
  }

  // Add the card to the catalog
  const card = await CatalogCard.create({
    game: request.game,
    name: request.name,
    set: request.set,
    setCode: request.cardNumber, // fallback
    cardNumber: request.cardNumber,
    rarity: request.rarity,
    language: 'en',
  })

  await CatalogRequest.findByIdAndUpdate(id, { status: 'approved' })

  return c.json({ message: 'Request approved and card added to catalog', card })
})

// ─── PATCH /api/catalog/requests/:id/reject — admin ──────────────────────────
catalogRoutes.patch('/requests/:id/reject', requireAdmin, async (c) => {
  const { id } = c.req.param()
  const request = await CatalogRequest.findById(id)
  if (!request) return c.json({ error: 'Request not found' }, 404)

  await CatalogRequest.findByIdAndUpdate(id, { status: 'rejected' })
  return c.json({ message: 'Request rejected' })
})

// ─── POST /api/catalog/requests — auth ───────────────────────────────────────
catalogRoutes.post('/requests', requireAuth, async (c) => {
  const clerkId = c.get('userId')
  const body = await c.req.json()

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400)
  }

  const user = await User.findOne({ clerkId })
  if (!user) return c.json({ error: 'User not synced' }, 400)

  const existing = await CatalogRequest.findOne({
    requestedBy: user._id,
    name: parsed.data.name,
    game: parsed.data.game,
    status: 'pending',
  })
  if (existing) {
    return c.json({ error: 'You already have a pending request for this card' }, 409)
  }

  const request = await CatalogRequest.create({
    requestedBy: user._id,
    ...parsed.data,
  })

  return c.json({ message: 'Card request submitted', request }, 201)
})

// ─── GET /api/catalog/:id — public ───────────────────────────────────────────
catalogRoutes.get('/:id', async (c) => {
  const { id } = c.req.param()
  const card = await CatalogCard.findById(id)
  if (!card) return c.json({ error: 'Card not found' }, 404)
  return c.json({ card })
})

// ─── POST /api/catalog — admin ────────────────────────────────────────────────
catalogRoutes.post('/', requireAdmin, async (c) => {
  const body = await c.req.json()
  const parsed = cardSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400)
  }

  // Prevent duplicate cards
  const duplicate = await CatalogCard.findOne({
    game: parsed.data.game,
    cardNumber: parsed.data.cardNumber,
    setCode: parsed.data.setCode,
  })
  if (duplicate) {
    return c.json({ error: 'A card with this game/setCode/cardNumber already exists', card: duplicate }, 409)
  }

  const card = await CatalogCard.create(parsed.data)
  return c.json({ message: 'Card added to catalog', card }, 201)
})

// ─── PATCH /api/catalog/:id — admin ──────────────────────────────────────────
catalogRoutes.patch('/:id', requireAdmin, async (c) => {
  const { id } = c.req.param()
  const body = await c.req.json()

  const card = await CatalogCard.findByIdAndUpdate(id, { $set: body }, { new: true, runValidators: true })
  if (!card) return c.json({ error: 'Card not found' }, 404)

  return c.json({ message: 'Card updated', card })
})

// ─── DELETE /api/catalog/:id — admin ─────────────────────────────────────────
catalogRoutes.delete('/:id', requireAdmin, async (c) => {
  const { id } = c.req.param()
  const card = await CatalogCard.findByIdAndDelete(id)
  if (!card) return c.json({ error: 'Card not found' }, 404)
  return c.json({ message: 'Card deleted' })
})
