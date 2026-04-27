import { createFileRoute, redirect } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from '../lib/api'
import { useAuth } from '@clerk/tanstack-start'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: ({ context }: any) => {
    if (context?.auth?.userId === null) {
      throw redirect({ to: '/' })
    }
  },
  component: DashboardPage,
})

function DashboardPage() {
  const apiFn = useApi()
  const { userId } = useAuth()
  const qc = useQueryClient()

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

  const stripeOnboard = useMutation({
    mutationFn: () => apiFn.dashboard.stripeOnboard(),
    onSuccess: (data: any) => {
      if (data?.onboardingUrl) window.location.href = data.onboardingUrl
    },
  })

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 flex justify-center">
        <div className="w-8 h-8 border-2 border-[var(--color-brand)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const { user, listings = [], offersReceived = [], offersSent = [] } = data ?? {}

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            Hola, {user?.username ?? '...'} 👋
          </h1>
          <p className="text-[var(--color-muted)] text-sm mt-1">
            ⭐ {user?.reputation?.toFixed(1) ?? '–'} · {user?.reviewCount ?? 0} reviews · rol: {user?.role}
          </p>
        </div>

        {/* Stripe Connect */}
        {user?.stripeConnectStatus !== 'active' && (
          <button
            onClick={() => stripeOnboard.mutate()}
            disabled={stripeOnboard.isPending}
            className="px-4 py-2 rounded-lg bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand)]/90 transition-all disabled:opacity-50"
          >
            {stripeOnboard.isPending ? 'Redirigiendo...' : '💳 Conectar Stripe'}
          </button>
        )}
      </div>

      {/* Offers received */}
      {offersReceived.length > 0 && (
        <section>
          <h2 className="font-semibold text-white mb-4">📬 Ofertas recibidas ({offersReceived.length})</h2>
          <div className="space-y-3">
            {offersReceived.map((offer: any) => (
              <div
                key={offer._id}
                className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)]"
              >
                <div>
                  <p className="text-sm text-white">
                    <span className="font-medium">{offer.buyer?.username}</span> ofrece{' '}
                    {offer.type === 'money'
                      ? `$${(offer.moneyAmount / 100).toFixed(2)}`
                      : offer.type === 'cards'
                      ? 'cartas'
                      : 'oferta mixta'}
                  </p>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">
                    por: {offer.listing?.catalogCard?.name ?? 'tu carta'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptOffer.mutate(offer._id)}
                    className="px-3 py-1.5 rounded-lg bg-green-600/20 border border-green-600/40 text-green-400 text-xs hover:bg-green-600/30 transition-all"
                  >
                    Aceptar
                  </button>
                  <button
                    onClick={() => declineOffer.mutate(offer._id)}
                    className="px-3 py-1.5 rounded-lg bg-red-600/20 border border-red-600/40 text-red-400 text-xs hover:bg-red-600/30 transition-all"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* My listings */}
      <section>
        <h2 className="font-semibold text-white mb-4">🃏 Mis listings ({listings.length})</h2>
        {listings.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">No tienes listings activos aún.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {listings.map((l: any) => (
              <div
                key={l._id}
                className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)]"
              >
                <p className="text-sm font-medium text-white truncate">{l.catalogCard?.name}</p>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">{l.status}</p>
                {l.price && (
                  <p className="text-sm font-semibold text-[var(--color-brand-light)] mt-1">
                    ${(l.price / 100).toFixed(2)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Offers sent */}
      {offersSent.length > 0 && (
        <section>
          <h2 className="font-semibold text-white mb-4">📤 Ofertas enviadas</h2>
          <div className="space-y-2">
            {offersSent.map((offer: any) => (
              <div
                key={offer._id}
                className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)]"
              >
                <p className="text-sm text-[var(--color-muted)]">
                  {offer.listing?.catalogCard?.name ?? 'carta'} ·{' '}
                  <span
                    className={`${
                      offer.status === 'pending'
                        ? 'text-yellow-400'
                        : offer.status === 'accepted'
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}
                  >
                    {offer.status}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
