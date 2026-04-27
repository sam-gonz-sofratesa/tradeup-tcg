import { createClerkClient, verifyToken } from '@clerk/backend'
import type { Context, Next } from 'hono'

export const clerkClient = createClerkClient({
  secretKey: process.env['CLERK_SECRET_KEY'],
  publishableKey: process.env['CLERK_PUBLISHABLE_KEY'],
})

type AppRole = 'buyer' | 'seller' | 'admin'

// Declare typed variables for Hono context
declare module 'hono' {
  interface ContextVariableMap {
    userId: string
    role: AppRole
  }
}

export async function requireAuth(c: Context, next: Next) {
  const authorization = c.req.header('Authorization')
  const token = authorization?.startsWith('Bearer ')
    ? authorization.replace('Bearer ', '')
    : undefined

  if (!token) {
    return c.json({ error: 'Unauthorized: missing bearer token' }, 401)
  }

  const secretKey = process.env['CLERK_SECRET_KEY']
  if (!secretKey) {
    return c.json({ error: 'Server misconfiguration: missing CLERK_SECRET_KEY' }, 500)
  }

  try {
    const payload = await verifyToken(token, {
      secretKey,
      // Allow requests from both customer app and backoffice
      authorizedParties: [
        process.env['CORS_ORIGIN'] ?? 'http://localhost:3000',
        process.env['CORS_ORIGIN_BACKOFFICE'] ?? 'http://localhost:3002',
      ],
    })

    // Role resolution: check public_metadata (set by Clerk Dashboard / admin API)
    // Falls back to 'buyer' for new users
    const role: AppRole =
      (payload as any)?.public_metadata?.role ??
      (payload as any)?.metadata?.role ??
      'buyer'

    c.set('userId', payload.sub)
    c.set('role', role)

    await next()
  } catch (err) {
    return c.json({ error: 'Unauthorized: invalid or expired token' }, 401)
  }
}

export async function requireSeller(c: Context, next: Next) {
  await requireAuth(c, async () => {})
  const role = c.get('role')
  if (!role) return c.json({ error: 'Unauthorized' }, 401)
  if (role !== 'seller' && role !== 'admin') {
    return c.json({ error: 'Forbidden: seller role required' }, 403)
  }
  await next()
}

export async function requireAdmin(c: Context, next: Next) {
  await requireAuth(c, async () => {})
  const role = c.get('role')
  if (!role) return c.json({ error: 'Unauthorized' }, 401)
  if (role !== 'admin') {
    return c.json({ error: 'Forbidden: admin role required' }, 403)
  }
  await next()
}
