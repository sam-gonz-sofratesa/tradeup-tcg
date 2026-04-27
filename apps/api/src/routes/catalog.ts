import { Hono } from 'hono'
import { requireAuth, requireAdmin } from '../lib/clerk.js'

export const catalogRoutes = new Hono()

// GET /api/catalog/search — public, for listing creation autocomplete
catalogRoutes.get('/search', async (c) => {
  const { q, game } = c.req.query()
  return c.json({ cards: [] })
})

// GET /api/catalog/:id
catalogRoutes.get('/:id', async (c) => {
  return c.json({ card: null })
})

// POST /api/catalog — admin only
catalogRoutes.post('/', requireAdmin, async (c) => {
  return c.json({ message: 'card added to catalog' }, 201)
})

// PATCH /api/catalog/:id — admin only
catalogRoutes.patch('/:id', requireAdmin, async (c) => {
  return c.json({ message: 'card updated' })
})

// DELETE /api/catalog/:id — admin only
catalogRoutes.delete('/:id', requireAdmin, async (c) => {
  return c.json({ message: 'card deleted' })
})

// POST /api/catalog/requests — auth user requests card addition
catalogRoutes.post('/requests', requireAuth, async (c) => {
  return c.json({ message: 'card request submitted' }, 201)
})

// GET /api/catalog/requests — admin sees pending requests
catalogRoutes.get('/requests', requireAdmin, async (c) => {
  return c.json({ requests: [] })
})

// PATCH /api/catalog/requests/:id/approve — admin approves
catalogRoutes.patch('/requests/:id/approve', requireAdmin, async (c) => {
  return c.json({ message: 'request approved, card added to catalog' })
})
