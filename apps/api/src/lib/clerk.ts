import { createClerkClient } from '@clerk/backend'

export const clerkClient = createClerkClient({
  secretKey: process.env['CLERK_SECRET_KEY'],
})

/**
 * Middleware factory: verifies Clerk session token from Authorization header.
 * Attaches userId and role to context.
 */
import type { Context, Next } from 'hono'

export async function requireAuth(c: Context, next: Next) {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const payload = await clerkClient.verifyToken(token)
    c.set('userId', payload.sub)
    c.set('role', (payload as any)['org_role'] ?? (payload as any)['metadata']?.role ?? 'buyer')
    await next()
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
}

export async function requireAdmin(c: Context, next: Next) {
  await requireAuth(c, async () => {})
  const role = c.get('role')
  if (role !== 'admin') return c.json({ error: 'Forbidden' }, 403)
  await next()
}
