import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

const CONDITION_LABEL: Record<string, string> = {
  mint: 'Mint', near_mint: 'NM', excellent: 'EX', good: 'Good', played: 'PL', poor: 'Poor',
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`w-4 h-4 ${
          s <= Math.round(value) ? 'text-yellow-400' : 'text-[var(--color-muted)]/30'
        }`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export function UserProfilePage() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['user-profile', id],
    queryFn: () => api.users.profile(id!),
    enabled: !!id,
  })

  if (isLoading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-[var(--color-brand)] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (isError || !data?.user) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <p className="text-4xl mb-4">😕</p>
      <p className="text-[var(--color-muted)]">Perfil no encontrado.</p>
      <Link to="/marketplace" className="text-[var(--color-brand-light)] hover:underline mt-4 inline-block">← Volver</Link>
    </div>
  )

  const { user, listings = [], reviews = [] } = data
  const joinYear = new Date(user.createdAt).getFullYear()

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      <Link to="/marketplace" className="text-sm text-[var(--color-muted)] hover:text-white transition-colors">← Marketplace</Link>

      {/* Header del perfil */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)]">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-brand)] to-purple-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
          {user.username?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold text-white">{user.username}</h1>
          <div className="flex items-center gap-3 mt-1">
            <StarRating value={user.reputation ?? 0} />
            <span className="text-white font-semibold text-sm">{user.reputation?.toFixed(1) ?? '0.0'}</span>
            <span className="text-[var(--color-muted)] text-sm">({user.reviewCount ?? 0} reviews)</span>
          </div>
          <p className="text-xs text-[var(--color-muted)] mt-1">Miembro desde {joinYear}</p>
        </div>
        <div className="flex gap-4 text-center">
          <div>
            <p className="text-xl font-bold text-white">{listings.length}</p>
            <p className="text-xs text-[var(--color-muted)]">Listings</p>
          </div>
          <div>
            <p className="text-xl font-bold text-white">{user.reviewCount ?? 0}</p>
            <p className="text-xs text-[var(--color-muted)]">Ventas</p>
          </div>
        </div>
      </div>

      {/* Listings activos */}
      <section>
        <h2 className="font-display text-lg font-semibold text-white mb-4">
          Cartas en venta
          <span className="ml-2 text-sm font-normal text-[var(--color-muted)]">({listings.length})</span>
        </h2>
        {listings.length === 0 ? (
          <p className="text-[var(--color-muted)] text-sm">Este vendedor no tiene listings activos.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map((l: any) => {
              const image = l.photos?.[0] ?? l.catalogCard?.imageUrl ?? null
              return (
                <Link key={l._id} to={`/listings/${l._id}`}
                  className="group rounded-[var(--radius-card)] bg-[var(--color-surface-2)] border border-[var(--color-border)] overflow-hidden card-glow block">
                  <div className="aspect-[3/4] bg-[var(--color-surface-3)] relative overflow-hidden">
                    {image
                      ? <img src={image} alt={l.catalogCard?.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="w-full h-full flex items-center justify-center text-3xl text-[var(--color-muted)]/20">🃏</div>}
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] bg-black/60 text-white">
                      {CONDITION_LABEL[l.condition] ?? l.condition}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-white truncate">{l.catalogCard?.name}</p>
                    <p className="text-xs text-[var(--color-muted)] truncate mt-0.5">{l.catalogCard?.set}</p>
                    <div className="mt-2">
                      {l.askingPrice
                        ? <span className="text-sm font-bold text-[var(--color-brand-light)]">${(l.askingPrice / 100).toFixed(2)}</span>
                        : <span className="text-xs text-blue-400">Solo trade</span>}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Reviews */}
      <section>
        <h2 className="font-display text-lg font-semibold text-white mb-4">
          Reseñas
          <span className="ml-2 text-sm font-normal text-[var(--color-muted)]">({reviews.length})</span>
        </h2>
        {reviews.length === 0 ? (
          <p className="text-[var(--color-muted)] text-sm">Este vendedor aún no tiene reseñas.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r: any) => (
              <div key={r._id} className="p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{r.reviewer?.username ?? 'Usuario'}</span>
                    <StarRating value={r.rating} />
                  </div>
                  <span className="text-xs text-[var(--color-muted)]">
                    {new Date(r.createdAt).toLocaleDateString('es-PA')}
                  </span>
                </div>
                {r.comment && <p className="text-sm text-[var(--color-muted)]">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
