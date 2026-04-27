// Global Hono context type augmentation.
// Kept in a standalone .d.ts so ContextVariableMap is visible
// to every route file without re-importing clerk.ts.
import type { AppRole } from './lib/clerk.js'

declare module 'hono' {
  interface ContextVariableMap {
    userId: string
    role: AppRole
  }
}
