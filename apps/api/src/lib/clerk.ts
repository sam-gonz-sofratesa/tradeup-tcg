import { createClerkClient } from '@clerk/backend'
import type { Context, Next } from 'hono'

// ─── Types ────────────────────────────────────────────────────────────────────
export type AppRole = 'buyer' | 'seller' | 'admin'

// ─── Clerk client instance ────────────────────────────────────────────────────
export const clerkClient = createClerkClient({
  secretKey: process.env['CLERK_SECRET_KEY'],
  publishableKey: process.env['CLERK_PUBLISHABLE_KEY'],
})

// ─── requireAuth ─────────────────────────────────────────────────────────────
// Verifies the Clerk session token from the Authorization: Bearer header.
// Uses clerkClient.verifyToken() — available in all @clerk/backend versions.
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
    // verifyToken is a method on the clerkClient instance in @clerk/backend v1
    const payload = await clerkClient.verifyToken(token, {
      authorizedParties: [
        process.env['CORS_ORIGIN'] ?? 'http://localhost:3000',
        process.env['CORS_ORIGIN_BACKOFFICE'] ?? 'http://localhost:3002',
      ],
    })

    // Role comes from Clerk public_metadata (set via Dashboard or admin API)
    const role: AppRole =
      (payload as any)?.public_metadata?.role ??
      (payload as any)?.metadata?.role ??
      'buyer'

    c.set('userId', payload.sub)
    c.set('role', role)

    await next()
  } catch {
    return c.json({ error: 'Unauthorized: invalid or expired token' }, 401)
  }
}

// ─── requireSeller ────────────────────────────────────────────────────────────
export async function requireSeller(c: Context, next: Next) {
  let passed = false
  await requireAuth(c, async () => { passed = true })
  if (!passed) return

  const role = c.get('role')
  if (role !== 'seller' && role !== 'admin') {
    return c.json({ error: 'Forbidden: seller role required' }, 403)
  }
  await next()
}

// ─── requireAdmin ─────────────────────────────────────────────────────────────
export async function requireAdmin(c: Context, next: Next) {
  let passed = false
  await requireAuth(c, async () => { passed = true })
  if (!passed) return

  const role = c.get('role')
  if (role !== 'admin') {
    return c.json({ error: 'Forbidden: admin role required' }, 403)
  }
  await next()
}
