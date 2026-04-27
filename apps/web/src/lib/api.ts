import { useAuth } from '@clerk/tanstack-start'

const BASE = import.meta.env['VITE_API_URL'] ?? 'http://localhost:3001'

async function authFetch(token: string | null, path: string, init: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as any)?.error ?? `HTTP ${res.status}`)
  }

  return res.json()
}

// ─ Public ──────────────────────────────────────────────────────────────
export const api = {
  listings: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return authFetch(null, `/api/listings${qs}`)
    },
    get: (id: string) => authFetch(null, `/api/listings/${id}`),
  },
  catalog: {
    search: (q: string, game?: string) =>
      authFetch(null, `/api/catalog/search?q=${encodeURIComponent(q)}${game ? `&game=${game}` : ''}`),
  },
  store: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return authFetch(null, `/api/store${qs}`)
    },
  },
}

// ─ Authenticated ─────────────────────────────────────────────────────
export function useApi() {
  const { getToken } = useAuth()

  async function authed(path: string, init: RequestInit = {}) {
    const token = await getToken()
    return authFetch(token, path, init)
  }

  return {
    auth: {
      sync: () => authed('/api/auth/sync', { method: 'POST' }),
    },
    listings: {
      create: (data: FormData) =>
        getToken().then((token) =>
          fetch(`${BASE}/api/listings`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: data,
          }).then((r) => r.json())
        ),
      update: (id: string, data: FormData) =>
        getToken().then((token) =>
          fetch(`${BASE}/api/listings/${id}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
            body: data,
          }).then((r) => r.json())
        ),
      delete: (id: string) => authed(`/api/listings/${id}`, { method: 'DELETE' }),
    },
    offers: {
      list: () => authed('/api/offers'),
      create: (data: object) => authed('/api/offers', { method: 'POST', body: JSON.stringify(data) }),
      accept: (id: string) => authed(`/api/offers/${id}/accept`, { method: 'POST' }),
      decline: (id: string) => authed(`/api/offers/${id}/decline`, { method: 'POST' }),
      cancel: (id: string) => authed(`/api/offers/${id}/cancel`, { method: 'POST' }),
    },
    dashboard: {
      get: () => authed('/api/users/me/dashboard'),
      stripeOnboard: () => authed('/api/users/me/stripe-onboard', { method: 'POST' }),
    },
    transactions: {
      list: (page = 1) => authed(`/api/transactions/me?page=${page}`),
    },
  }
}
