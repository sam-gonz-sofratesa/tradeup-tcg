import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireAuth } from '../lib/clerk.js'

export const listingRoutes = new Hono()

// GET /api/listings — public, filterable
listingRoutes.get('/', async (c) => {
  const { game, rarity, condition, minPrice, maxPrice, page = '1', limit = '20' } = c.req.query()
  // TODO: query MongoDB Listing model with filters
  return c.json({ listings: [], total: 0, page: Number(page), limit: Number(limit) })
})

// GET /api/listings/:id — public
listingRoutes.get('/:id', async (c) => {
  const { id } = c.req.param()
  // TODO: fetch listing by id with card catalog data and seller info
  return c.json({ listing: null })
})

// POST /api/listings — auth required, multipart form
listingRoutes.post('/', requireAuth, async (c) => {
  const body = await c.req.parseBody({ all: true })
  // TODO: validate, save photos via storage.ts, create Listing document
  return c.json({ message: 'listing created', listing: null }, 201)
})

// PATCH /api/listings/:id — auth, owner only
listingRoutes.patch('/:id', requireAuth, async (c) => {
  return c.json({ message: 'listing updated' })
})

// DELETE /api/listings/:id — auth, owner only
listingRoutes.delete('/:id', requireAuth, async (c) => {
  return c.json({ message: 'listing deleted' })
})
