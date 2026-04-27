import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export const Route = createFileRoute('/marketplace')({
  component: MarketplacePage,
})

const GAMES = [
  { value: '', label: 'Todos' },
  { value: 'pokemon', label: 'Pokémon' },
  { value: 'yugioh', label: 'Yu-Gi-Oh!' },
  { value: 'onepiece', label: 'One Piece' },
  { value: 'dragonball', label: 'Dragon Ball' },
  { value: 'mtg', label: 'MTG' },
]

const CONDITIONS = [
  { value: '', label: 'Cualquier condición' },
  { value: 'mint', label: 'Mint' },
  { value: 'near_mint', label: 'Near Mint' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'played', label: 'Played' },
]

function MarketplacePage() {
  const search = Route.useSearch() as any
  const game = search?.game ?? ''
  const condition = search?.condition ?? ''

  const { data, isLoading, isError } = useQuery({
    queryKey: ['listings', game, condition],
    queryFn: () =>
      api.listings.list({
        ...(game ? { game } : {}),
        ...(condition ? { condition } : {}),
      }),
  })

  const listings: any[] = data?.listings ?? []

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white mb-1">Marketplace</h1>
        <p className="text-[var(--color-muted)] text-sm">
          {data?.total ?? '...'} listings disponibles
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        {/* Game filter */}
        <div className="flex gap-2 flex-wrap">
          {GAMES.map((g) => (
            <Link
              key={g.value}
              to="/marketplace"
              search={{ game: g.value, condition }}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                game === g.value
                  ? 'bg-[var(--color-brand)] border-[var(--color-brand)] text-white'
                  : 'bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-muted)] hover:text-white hover:border-[var(--color-brand)]/50'
              }`}
            >
              {g.label}
            </Link>
          ))}
        </div>

        {/* Condition filter */}
        <select
          className="px-3 py-1.5 rounded-lg text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-brand)] ml-auto"
          value={condition}
          onChange={(e) => {
            window.location.href = `/marketplace?game=${game}&condition=${e.target.value}`
          }}
        >
          {CONDITIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] rounded-[var(--radius-card)] bg-[var(--color-surface-2)] animate-pulse"
            />
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center py-20 text-[var(--color-muted)]">
          Error cargando listings. ¿El servidor está corriendo?
        </div>
      )}

      {!isLoading && !isError && listings.length === 0 && (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🃏</p>
          <p className="text-[var(--color-muted)]">No hay listings disponibles aún.</p>
          <p className="text-sm text-[var(--color-muted)]/60 mt-1">¡Sé el primero en publicar una carta!</p>
        </div>
      )}

      {!isLoading && listings.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {listings.map((listing: any) => (
            <ListingCard key={listing._id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  )
}

function ListingCard({ listing }: { listing: any }) {
  const card = listing.catalogCard
  const photo = listing.photos?.[0]

  return (
    <Link
      to="/listings/$id"
      params={{ id: listing._id }}
      className="group block rounded-[var(--radius-card)] bg-[var(--color-surface-2)] border border-[var(--color-border)] overflow-hidden card-glow"
    >
      {/* Card image */}
      <div className="aspect-[3/4] bg-[var(--color-surface-3)] relative overflow-hidden">
        {photo ? (
          <img
            src={photo}
            alt={card?.name ?? 'Card'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-[var(--color-muted)]/30">
            🃏
          </div>
        )}
        {/* Condition badge */}
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-xs font-medium bg-black/60 text-white backdrop-blur-sm">
          {listing.condition}
        </span>
        {/* Offer types */}
        <div className="absolute top-2 right-2 flex gap-1">
          {listing.acceptsMoney && (
            <span className="w-5 h-5 rounded-full bg-green-500/80 flex items-center justify-center text-xs">$</span>
          )}
          {listing.acceptsTrades && (
            <span className="w-5 h-5 rounded-full bg-blue-500/80 flex items-center justify-center text-xs">↔</span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-medium text-white truncate">{card?.name ?? 'Carta'}</p>
        <p className="text-xs text-[var(--color-muted)] truncate mt-0.5">{card?.set ?? ''}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-[var(--color-muted)]">
            {listing.seller?.username ?? ''}
          </span>
          {listing.price ? (
            <span className="text-sm font-semibold text-[var(--color-brand-light)]">
              ${(listing.price / 100).toFixed(2)}
            </span>
          ) : (
            <span className="text-xs text-[var(--color-muted)]">Solo trade</span>
          )}
        </div>
      </div>
    </Link>
  )
}
