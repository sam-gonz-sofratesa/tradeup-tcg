import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from '../lib/api'
import { useAuth } from '@clerk/clerk-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

const STATUS_COLORS: Record<string, string> = {
  pending:  'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  accepted: 'text-green-400 bg-green-400/10 border-green-400/30',
  declined: 'text-red-400 bg-red-400/10 border-red-400/30',
  cancelled:'text-[var(--color-muted)] bg-[var(--color-surface-3)] border-[var(--color-border)]',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', accepted: 'Aceptada', declined: 'Rechazada', cancelled: 'Cancelada',
}

const OFFER_TYPE_LABEL: Record<string, string> = {
  money: '💵 Dinero', cards: '🃏 Cartas', mixed: '🔀 Mixta',
}

export function DashboardPage() {
  const apiFn = useApi()
  const { userId } = useAuth()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'received' | 'sent' | 'listings'>('received')

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiFn.dashboard.get(),
    enabled: !!userId,
  })

  const acceptOffer = useMutation({
    mutationFn: (id: string) => apiFn.offers.accept(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dashboard'] }),
  })
  const declineOffer = useMutation({
    mutationFn: (id: string) => apiFn.offers.decline(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dashboard'] }),
  })
  const cancelOffer = useMutation({
    mutationFn: (id: string) => apiFn.offers.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dashboard'] }),
  })
  const deleteListing = useMutation({
    mutationFn: (id: string) => apiFn.listings.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dashboard'] }),
  })
  const stripeOnboard = useMutation({
    mutationFn: () => apiFn.dashboard.stripeOnboard(),
    onSuccess: (data: any) => { if (data?.onboardingUrl) window.location.href = data.onboardingUrl },
  })

  if (isLoading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-[var(--color-brand)] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const { user, listings = [], offersReceived = [], offersSent = [] } = data ?? {}
  const pendingReceived = offersReceived.filter((o: any) => o.status === 'pending')

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Hola, {user?.username ?? '...'} 👋</h1>
          <p className="text-[var(--color-muted)] text-sm mt-1">
            ⭐ {user?.reputation?.toFixed(1) ?? '0.0'} · {user?.reviewCount ?? 0} reviews ·
            <span className="ml-1 capitalize">{user?.role}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {user?.stripeConnectStatus !== 'active' && (
            <button
              onClick={() => stripeOnboard.mutate()}
              disabled={stripeOnboard.isPending}
              className="px-4 py-2 rounded-lg bg-[var(--color-brand)]/20 border border-[var(--color-brand)]/40 text-[var(--color-brand-light)] text-sm font-medium hover:bg-[var(--color-brand)]/30 transition-all disabled:opacity-50"
            >
              {stripeOnboard.isPending ? 'Redirigiendo...' : '💳 Conectar Stripe'}
            </button>
          )}
          {/* Acceso rápido a Mis Pedidos */}
          <Link
            to="/orders"
            className="px-4 py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-muted)] text-sm font-medium hover:text-white hover:border-[var(--color-brand)]/50 transition-all"
          >
            📦 Mis Pedidos
          </Link>
          <Link
            to="/listings/new"
            className="px-4 py-2 rounded-lg bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand)]/90 transition-all"
          >
            + Publicar carta
          </Link>
        </div>
      </div>

      {/* Stats rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Listings activos', value: listings.filter((l: any) => l.status === 'active').length },
          { label: 'Ofertas recibidas', value: offersReceived.length, highlight: pendingReceived.length > 0 },
          { label: 'Ofertas enviadas', value: offersSent.length },
          { label: 'Reputación', value: user?.reputation?.toFixed(1) ?? '0.0' },
        ].map((s) => (
          <div key={s.label} className={`p-4 rounded-xl border ${
            s.highlight
              ? 'bg-[var(--color-brand)]/10 border-[var(--color-brand)]/40'
              : 'bg-[var(--color-surface-2)] border-[var(--color-border)]'
          }`}>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-border)] gap-1">
        {([
          { key: 'received', label: `Ofertas recibidas${pendingReceived.length > 0 ? ` (${pendingReceived.length})` : ''}` },
          { key: 'sent',     label: `Ofertas enviadas` },
          { key: 'listings', label: `Mis listings` },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === t.key
                ? 'border-[var(--color-brand)] text-white'
                : 'border-transparent text-[var(--color-muted)] hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Ofertas recibidas */}
      {activeTab === 'received' && (
        <div className="space-y-3">
          {offersReceived.length === 0 && (
            <p className="text-[var(--color-muted)] text-sm py-8 text-center">No has recibido ofertas aún.</p>
          )}
          {offersReceived.map((offer: any) => (
            <div key={offer._id} className="p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-14 rounded bg-[var(--color-surface-3)] overflow-hidden shrink-0">
                    {offer.listing?.catalogCard?.imageUrl
                      ? <img src={offer.listing.catalogCard.imageUrl} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-lg">🃏</div>}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {offer.listing?.catalogCard?.name ?? 'Carta'}
                    </p>
                    <p className="text-xs text-[var(--color-muted)] mt-0.5">
                      De: <span className="text-white">{offer.buyer?.username ?? 'Usuario'}</span>
                      {' · '}{OFFER_TYPE_LABEL[offer.type] ?? offer.type}
                      {offer.moneyAmount ? ` · $${(offer.moneyAmount / 100).toFixed(2)}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${STATUS_COLORS[offer.status] ?? ''}` }>
                    {STATUS_LABEL[offer.status] ?? offer.status}
                  </span>
                </div>
              </div>
              {offer.status === 'pending' && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => acceptOffer.mutate(offer._id)}
                    disabled={acceptOffer.isPending}
                    className="flex-1 py-2 rounded-lg bg-green-600/20 border border-green-600/40 text-green-400 text-sm font-medium hover:bg-green-600/30 transition-all disabled:opacity-50"
                  >
                    ✓ Aceptar
                  </button>
                  <button
                    onClick={() => declineOffer.mutate(offer._id)}
                    disabled={declineOffer.isPending}
                    className="flex-1 py-2 rounded-lg bg-red-600/20 border border-red-600/40 text-red-400 text-sm font-medium hover:bg-red-600/30 transition-all disabled:opacity-50"
                  >
                    ✕ Rechazar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab: Ofertas enviadas */}
      {activeTab === 'sent' && (
        <div className="space-y-3">
          {offersSent.length === 0 && (
            <p className="text-[var(--color-muted)] text-sm py-8 text-center">No has enviado ofertas aún.</p>
          )}
          {offersSent.map((offer: any) => (
            <div key={offer._id} className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-14 rounded bg-[var(--color-surface-3)] overflow-hidden shrink-0">
                  {offer.listing?.catalogCard?.imageUrl
                    ? <img src={offer.listing.catalogCard.imageUrl} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-lg">🃏</div>}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {offer.listing?.catalogCard?.name ?? 'Carta'}
                  </p>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">
                    {OFFER_TYPE_LABEL[offer.type] ?? offer.type}
                    {offer.moneyAmount ? ` · $${(offer.moneyAmount / 100).toFixed(2)}` : ''}
                    {' · Para: '}{offer.listing?.seller?.username ?? 'vendedor'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-xs border ${STATUS_COLORS[offer.status] ?? ''}`}>
                  {STATUS_LABEL[offer.status] ?? offer.status}
                </span>
                {offer.status === 'pending' && (
                  <button
                    onClick={() => cancelOffer.mutate(offer._id)}
                    disabled={cancelOffer.isPending}
                    className="text-xs text-[var(--color-muted)] hover:text-red-400 transition-colors"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Mis listings */}
      {activeTab === 'listings' && (
        <div>
          {listings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🃏</p>
              <p className="text-[var(--color-muted)] text-sm mb-4">No tienes listings activos aún.</p>
              <Link to="/listings/new" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-brand)] text-white text-sm font-semibold hover:bg-[var(--color-brand)]/90 transition-all">
                + Publicar tu primera carta
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {listings.map((l: any) => (
                <div key={l._id} className="rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] overflow-hidden">
                  <div className="aspect-[3/4] bg-[var(--color-surface-3)] relative">
                    {(l.photos?.[0] ?? l.catalogCard?.imageUrl)
                      ? <img src={l.photos?.[0] ?? l.catalogCard?.imageUrl} alt={l.catalogCard?.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-3xl text-[var(--color-muted)]/20">🃏</div>}
                    <span className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      l.status === 'active' ? 'bg-green-500/80 text-white' : 'bg-[var(--color-muted)]/50 text-white'
                    }`}>{l.status}</span>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-white truncate">{l.catalogCard?.name}</p>
                    <p className="text-xs text-[var(--color-muted)] mt-0.5">{l.condition}</p>
                    <div className="flex items-center justify-between mt-2">
                      {l.askingPrice
                        ? <span className="text-sm font-bold text-[var(--color-brand-light)]">${(l.askingPrice / 100).toFixed(2)}</span>
                        : <span className="text-xs text-[var(--color-muted)]">Solo trade</span>}
                      {l.status === 'active' && (
                        <button
                          onClick={() => deleteListing.mutate(l._id)}
                          disabled={deleteListing.isPending}
                          className="text-xs text-[var(--color-muted)] hover:text-red-400 transition-colors"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
