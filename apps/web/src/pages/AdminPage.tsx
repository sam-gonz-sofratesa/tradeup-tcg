import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from '../lib/api'
import { useState } from 'react'

const SHIPPING_OPTIONS = ['pending','preparing','shipped','delivered']

export function AdminPage() {
  const apiFn = useApi()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'metrics' | 'users' | 'orders'>('metrics')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [orderStatus, setOrderStatus] = useState('')
  const [userPage, setUserPage] = useState(1)
  const [orderPage, setOrderPage] = useState(1)

  const metrics = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: () => apiFn.admin.metrics(),
    enabled: tab === 'metrics',
  })

  const users = useQuery({
    queryKey: ['admin-users', search, roleFilter, userPage],
    queryFn: () => apiFn.admin.users({ page: userPage, search: search || undefined, role: roleFilter || undefined }),
    enabled: tab === 'users',
  })

  const orders = useQuery({
    queryKey: ['admin-orders', orderStatus, orderPage],
    queryFn: () => apiFn.admin.transactions({ page: orderPage, status: orderStatus || undefined }),
    enabled: tab === 'orders',
  })

  const banUser = useMutation({
    mutationFn: ({ id, banned }: { id: string; banned: boolean }) => apiFn.admin.banUser(id, banned),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const setRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => apiFn.admin.setRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const updateShipping = useMutation({
    mutationFn: ({ id, shippingStatus }: { id: string; shippingStatus: string }) =>
      apiFn.admin.updateShipping(id, shippingStatus),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-orders'] }),
  })

  const m = metrics.data

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-white mb-6">🛡️ Admin Panel</h1>

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-border)] gap-1 mb-6">
        {(['metrics','users','orders'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t ? 'border-[var(--color-brand)] text-white' : 'border-transparent text-[var(--color-muted)] hover:text-white'
            }`}>{t === 'metrics' ? 'Métricas' : t === 'users' ? 'Usuarios' : 'Pedidos'}
          </button>
        ))}
      </div>

      {/* Métricas */}
      {tab === 'metrics' && (
        metrics.isLoading ? <p className="text-[var(--color-muted)]">Cargando...</p> : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Total transacciones', value: m?.transactions?.total ?? 0 },
              { label: 'Este mes', value: m?.transactions?.thisMonth ?? 0 },
              { label: 'Revenue total', value: `$${((m?.revenue?.total ?? 0) / 100).toFixed(2)}` },
              { label: 'Revenue este mes', value: `$${((m?.revenue?.thisMonth ?? 0) / 100).toFixed(2)}` },
              { label: 'Usuarios activos', value: m?.activeUsers ?? 0 },
              { label: 'Ofertas pendientes', value: m?.pendingOffers ?? 0 },
              { label: 'Listings activos', value: m?.activeListings ?? 0 },
            ].map(s => (
              <div key={s.label} className="p-5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)]">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-[var(--color-muted)] mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )
      )}

      {/* Usuarios */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <input
              className="flex-1 min-w-[200px] px-4 py-2 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-white text-sm placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-brand)]"
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setUserPage(1) }}
            />
            <select
              className="px-3 py-2 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm text-[var(--color-muted)] focus:outline-none"
              value={roleFilter}
              onChange={e => { setRoleFilter(e.target.value); setUserPage(1) }}
            >
              <option value="">Todos los roles</option>
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {users.isLoading ? <p className="text-[var(--color-muted)]">Cargando...</p> : (
            <div className="space-y-2">
              {(users.data?.users ?? []).map((u: any) => (
                <div key={u._id} className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] gap-3 flex-wrap">
                  <div>
                    <p className="text-sm font-medium text-white">{u.username}</p>
                    <p className="text-xs text-[var(--color-muted)]">{u.email} · {u.role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="px-2 py-1 text-xs rounded bg-[var(--color-surface-3)] border border-[var(--color-border)] text-white"
                      value={u.role}
                      onChange={e => setRole.mutate({ id: u._id, role: e.target.value })}
                    >
                      <option value="buyer">buyer</option>
                      <option value="seller">seller</option>
                      <option value="admin">admin</option>
                    </select>
                    <button
                      onClick={() => banUser.mutate({ id: u._id, banned: !u.isBanned })}
                      className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        u.isBanned
                          ? 'bg-green-600/20 border border-green-600/40 text-green-400'
                          : 'bg-red-600/20 border border-red-600/40 text-red-400'
                      }`}
                    >
                      {u.isBanned ? 'Desbanear' : 'Banear'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Paginación */}
          <div className="flex justify-center gap-3 mt-4">
            <button onClick={() => setUserPage(p => Math.max(p-1,1))} disabled={userPage===1} className="px-4 py-2 text-sm rounded-lg border border-[var(--color-border)] text-[var(--color-muted)] disabled:opacity-40">←</button>
            <span className="text-[var(--color-muted)] text-sm self-center">{userPage} / {Math.ceil((users.data?.total ?? 1) / 20)}</span>
            <button onClick={() => setUserPage(p => p+1)} disabled={userPage >= Math.ceil((users.data?.total ?? 1) / 20)} className="px-4 py-2 text-sm rounded-lg border border-[var(--color-border)] text-[var(--color-muted)] disabled:opacity-40">→</button>
          </div>
        </div>
      )}

      {/* Pedidos */}
      {tab === 'orders' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <select
              className="px-3 py-2 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm text-[var(--color-muted)] focus:outline-none"
              value={orderStatus}
              onChange={e => { setOrderStatus(e.target.value); setOrderPage(1) }}
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          {orders.isLoading ? <p className="text-[var(--color-muted)]">Cargando...</p> : (
            <div className="space-y-2">
              {(orders.data?.transactions ?? []).map((tx: any) => (
                <div key={tx._id} className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] gap-3 flex-wrap">
                  <div>
                    <p className="text-sm font-medium text-white font-mono">{tx._id.slice(-10)}</p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {tx.buyer?.username ?? '?'} · {tx.type} · ${((tx.grossAmount ?? 0)/100).toFixed(2)}
                    </p>
                    <p className="text-xs text-[var(--color-muted)]">
                      Pago: <span className="text-white">{tx.status}</span>
                      {' · '} Envío: <span className="text-white">{tx.shippingStatus}</span>
                    </p>
                  </div>
                  <select
                    className="px-2 py-1 text-xs rounded bg-[var(--color-surface-3)] border border-[var(--color-border)] text-white"
                    value={tx.shippingStatus}
                    onChange={e => updateShipping.mutate({ id: tx._id, shippingStatus: e.target.value })}
                  >
                    {SHIPPING_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-center gap-3 mt-4">
            <button onClick={() => setOrderPage(p => Math.max(p-1,1))} disabled={orderPage===1} className="px-4 py-2 text-sm rounded-lg border border-[var(--color-border)] text-[var(--color-muted)] disabled:opacity-40">←</button>
            <span className="text-[var(--color-muted)] text-sm self-center">{orderPage} / {Math.ceil((orders.data?.total ?? 1) / 20)}</span>
            <button onClick={() => setOrderPage(p => p+1)} disabled={orderPage >= Math.ceil((orders.data?.total ?? 1) / 20)} className="px-4 py-2 text-sm rounded-lg border border-[var(--color-border)] text-[var(--color-muted)] disabled:opacity-40">→</button>
          </div>
        </div>
      )}
    </div>
  )
}
