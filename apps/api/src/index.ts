import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serveStatic } from 'hono/bun'
import { connectDB } from './lib/db.js'

// Route imports
import { authRoutes } from './routes/auth.js'
import { listingRoutes } from './routes/listings.js'
import { offerRoutes } from './routes/offers.js'
import { catalogRoutes } from './routes/catalog.js'
import { storeRoutes } from './routes/store.js'
import { userRoutes } from './routes/users.js'
import { transactionRoutes } from './routes/transactions.js'
import { webhookRoutes } from './routes/webhooks.js'
import { adminRoutes } from './routes/admin.js'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('/api/*', cors({
  origin: process.env['CORSORIGIN'] ?? 'http://localhost:3000',
  credentials: true,
}))

// Static file serving for uploads (dev only)
app.use('/uploads/*', serveStatic({ root: './' }))

// Stripe webhook (raw body needed — mount before JSON middleware)
app.route('/webhooks', webhookRoutes)

// API routes
app.route('/api/auth', authRoutes)
app.route('/api/listings', listingRoutes)
app.route('/api/offers', offerRoutes)
app.route('/api/catalog', catalogRoutes)
app.route('/api/store', storeRoutes)
app.route('/api/users', userRoutes)
app.route('/api/transactions', transactionRoutes)
app.route('/api/admin', adminRoutes)

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// Boot
const port = Number(process.env['PORT'] ?? 3001)

await connectDB()
console.log(`🃏 TradeUp API running on http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
}
