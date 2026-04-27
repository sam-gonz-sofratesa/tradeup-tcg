import { useAuth } from '@clerk/clerk-react'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

async function request(url: string, options: RequestInit = {}, token?: string) {
  const headers: Record<string, string> = {
    ...(options.body && !(options.body instanceof FormData)
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> ?? {}),
  }
  const res = await fetch(`${BASE}${url}`, { ...options, headers })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as any).error ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  listings: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return request(`/api/listings${qs}`)
    },
    get: (id: string) => request(`/api/listings/${id}`),
  },
  catalog: {
    search: (q: string, game?: string) =>
      request(`/api/catalog/search?q=${encodeURIComponent(q)}${game ? `&game=${game}` : ''}`),
  },
  store: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return request(`/api/store${qs}`)
    },
    get: (id: string) => request(`/api/store/${id}`),
  },
  users: {
    profile: (id: string) => request(`/api/users/${id}/profile`),
  },
}

export function useApi() {
  const { getToken } = useAuth()

  async function authRequest(url: string, options: RequestInit = {}) {
    const token = await getToken()
    return request(url, options, token ?? undefined)
  }

  return {
    auth: {
      sync: () => authRequest('/api/auth/sync', { method: 'POST' }),
    },
    listings: {
      list: (params?: Record<string, string>) => {
        const qs = params ? '?' + new URLSearchParams(params).toString() : ''
        return authRequest(`/api/listings${qs}`)
      },
      get: (id: string) => authRequest(`/api/listings/${id}`),
      create: (body: FormData) => authRequest('/api/listings', { method: 'POST', body }),
      delete: (id: string) => authRequest(`/api/listings/${id}`, { method: 'DELETE' }),
    },
    offers: {
      create: (body: object) =>
        authRequest('/api/offers', { method: 'POST', body: JSON.stringify(body) }),
      accept: (id: string) => authRequest(`/api/offers/${id}/accept`, { method: 'POST' }),
      decline: (id: string) => authRequest(`/api/offers/${id}/decline`, { method: 'POST' }),
      cancel: (id: string) => authRequest(`/api/offers/${id}/cancel`, { method: 'POST' }),
    },
    payments: {
      c2cIntent: (body: { listingId: string; amount: number }) =>
        authRequest('/api/payments/c2c-intent', { method: 'POST', body: JSON.stringify(body) }),
      storeIntent: (body: { storeItemId: string }) =>
        authRequest('/api/payments/store-intent', { method: 'POST', body: JSON.stringify(body) }),
    },
    transactions: {
      me: (params?: { page?: number; type?: string }) => {
        const qs = params ? '?' + new URLSearchParams(
          Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
        ).toString() : ''
        return authRequest(`/api/transactions/me${qs}`)
      },
      get: (id: string) => authRequest(`/api/transactions/${id}`),
      review: (id: string, body: { rating: number; comment?: string }) =>
        authRequest(`/api/transactions/${id}/review`, { method: 'POST', body: JSON.stringify(body) }),
    },
    notifications: {
      summary: () => authRequest('/api/notifications/summary'),
    },
    dashboard: {
      get: () => authRequest('/api/users/me/dashboard'),
      stripeOnboard: () => authRequest('/api/users/me/stripe-onboard', { method: 'POST' }),
    },
    admin: {
      metrics: () => authRequest('/api/admin/metrics'),
      users: (params?: { page?: number; search?: string; role?: string }) => {
        const qs = params ? '?' + new URLSearchParams(
          Object.fromEntries(Object.entries(params).filter(([,v]) => v !== undefined).map(([k,v]) => [k, String(v)]))
        ).toString() : ''
        return authRequest(`/api/admin/users${qs}`)
      },
      banUser: (id: string, banned: boolean) =>
        authRequest(`/api/admin/users/${id}/ban`, { method: 'PATCH', body: JSON.stringify({ banned }) }),
      setRole: (id: string, role: string) =>
        authRequest(`/api/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
      transactions: (params?: { page?: number; status?: string; type?: string }) => {
        const qs = params ? '?' + new URLSearchParams(
          Object.fromEntries(Object.entries(params).filter(([,v]) => v !== undefined).map(([k,v]) => [k, String(v)]))
        ).toString() : ''
        return authRequest(`/api/transactions${qs}`)
      },
      updateShipping: (id: string, shippingStatus: string) =>
        authRequest(`/api/admin/transactions/${id}/shipping`, { method: 'PATCH', body: JSON.stringify({ shippingStatus }) }),
    },
    users: {
      profile: (id: string) => authRequest(`/api/users/${id}/profile`),
    },
  }
}
