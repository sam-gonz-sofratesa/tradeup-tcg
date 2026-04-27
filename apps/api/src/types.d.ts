import type { AppRole } from './lib/clerk'

declare module 'hono' {
  interface ContextVariableMap {
    userId: string
    role: AppRole
  }
}
