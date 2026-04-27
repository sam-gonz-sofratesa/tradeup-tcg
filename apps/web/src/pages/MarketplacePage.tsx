import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useState, useEffect } from 'react'
import { useDebounce } from '../hooks/useDebounce'

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

export function MarketplacePage() {
  const [params, setParams] = useSearchParams()
  const game = params.get('game') ?? ''
  const condition = params.get('condition') ?? ''
  const [searchInput, setSearchInput] = useState(params.get('q') ?? '')
  const debouncedSearch = useDebounce(searchInput, 350)

  // Sync debounced search to URL
  useEffect(() => {
    const next: Record<string, string> = {}
    if (game) next['game'] = game
    if (condition) next['condition'] = condition
    if (debouncedSearch) next['q'] = debouncedSearch
    setParams(next, { replace: true })
  }, [debouncedSearch])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['listings', game, condition, debouncedSearch],
    queryFn: () => api.listings.list({
      ...(game ? { game } : {}),
      ...(condition ? { condition } : {}),
      ...(debouncedSearch ? { q: debouncedSearch } : {}),
    }),
  })

  const listings: any[] = data?.listings ?? []

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-white mb-1">Marketplace</h1>
        <p className="text-[var(--color-muted)] text-sm">{data?.total ?? '...'} listings disponibles</p>
      </div>

      {/* Search bar */}
      <div className="relative mb-5">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)] text-lg">🔍</span>
        <input
          type="text"
          placeholder="Buscar carta por nombre..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-white text-sm placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
        />
        {searchInput && (
          <button
            onClick={() => setSearchInput('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-white text-lg"
          >×</button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <div className="flex gap-2 flex-wrap">
          {GAMES.map((g) => (
            <button
              key={g.value}
              onClick={() => setParams({ game: g.value, condition, ...(debouncedSearch ? { q: debouncedSearch } : {}) })}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                game === g.value
                  ? 'bg-[var(--color-brand)] border-[var(--color-brand)] text-white'
                  : 'bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-muted)] hover:text-white hover:border-[var(--color-brand)]/50'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
        <select
          className="px-3 py-1.5 rounded-lg text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-brand)] ml-auto"
          value={condition}
          onChange={(e) => setParams({ game, condition: e.target.value, ...(debouncedSearch ? { q: debouncedSearch } : {}) })}
        >
          {CONDITIONS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-[var(--radius-card)] bg-[var(--color-surface-2)] animate-pulse" />
          ))}
        </div>
      )}
      {isError && (
        <div className="text-center py-20 text-[var(--color-muted)]">Error cargando listings.</div>
      )}
      {!isLoading && !isError && listings.length === 0 && (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🃏</p>
          <p className="text-[var(--color-muted)]">
            {debouncedSearch ? `No se encontraron cartas para "${debouncedSearch}".` : 'No hay listings disponibles aún.'}
          </p>
          {debouncedSearch && (
            <button onClick={() => setSearchInput('')} className="mt-3 text-sm text-[var(--color-brand-light)] hover:underline">
              Limpiar búsqueda
            </button>
          )}
        </div>
      )}
      {!isLoading && listings.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {listings.map((listing: any) => <ListingCard key={listing._id} listing={listing} />)}
        </div>
      )}
    </div>
  )
}

function ListingCard({ listing }: { listing: any }) {
  const card = listing.catalogCard
  const image = listing.photos?.[0] ?? card?.imageUrl ?? null

  return (
    <Link to={`/listings/${listing._id}`} className="group block rounded-[var(--radius-card)] bg-[var(--color-surface-2)] border border-[var(--color-border)] overflow-hidden card-glow">
      <div className="aspect-[3/4] bg-[var(--color-surface-3)] relative overflow-hidden">
        {image ? (
          <img src={image} alt={card?.name ?? 'Card'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-[var(--color-muted)]/30">🃏</div>
        )}
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-xs font-medium bg-black/60 text-white backdrop-blur-sm">{listing.condition}</span>
        <div className="absolute top-2 right-2 flex gap-1">
          {listing.askingPrice && <span className="w-5 h-5 rounded-full bg-green-500/80 flex items-center justify-center text-xs">$</span>}
          {!listing.askingPrice && <span className="w-5 h-5 rounded-full bg-blue-500/80 flex items-center justify-center text-xs">⇔</span>}
        </div>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-white truncate">{card?.name ?? 'Carta'}</p>
        <p className="text-xs text-[var(--color-muted)] truncate mt-0.5">{card?.set ?? ''}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-[var(--color-muted)]">{listing.seller?.username ?? ''}</span>
          {listing.askingPrice
            ? <span className="text-sm font-semibold text-[var(--color-brand-light)]">${(listing.askingPrice / 100).toFixed(2)}</span>
            : <span className="text-xs text-[var(--color-muted)]">Solo trade</span>}
        </div>
      </div>
    </Link>
  )
}
