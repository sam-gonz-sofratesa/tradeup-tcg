import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth, SignInButton } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { StoreCheckoutModal } from '../components/StoreCheckoutModal'
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
  { value: '', label: 'Condición' },
  { value: 'mint', label: 'Mint' },
  { value: 'near_mint', label: 'Near Mint' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'played', label: 'Played' },
]

const PRICE_RANGES = [
  { label: 'Cualquier precio', min: '', max: '' },
  { label: 'Menos de $25',    min: '',    max: '2500' },
  { label: '$25 – $50',       min: '2500', max: '5000' },
  { label: '$50 – $100',      min: '5000', max: '10000' },
  { label: 'Más de $100',     min: '10000', max: '' },
]

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Más recientes' },
  { value: 'price_asc',  label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'oldest',     label: 'Más antiguos' },
]

const CONDITION_LABEL: Record<string, string> = {
  mint: 'Mint', near_mint: 'NM', excellent: 'EX', good: 'Good', played: 'PL', poor: 'Poor',
}

type ViewMode = 'grid' | 'list'

export function StorePage() {
  const { isSignedIn } = useAuth()
  const [game, setGame] = useState('')
  const [condition, setCondition] = useState('')
  const [priceRange, setPriceRange] = useState(0) // index of PRICE_RANGES
  const [graded, setGraded] = useState<'' | 'true' | 'false'>('')
  const [sort, setSort] = useState('newest')
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 350)
  const [page, setPage] = useState(1)
  const [view, setView] = useState<ViewMode>('grid')
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [checkoutItem, setCheckoutItem] = useState<any | null>(null)

  // Reset page on any filter change
  useEffect(() => { setPage(1) }, [game, condition, priceRange, graded, sort, debouncedSearch])

  const pr = PRICE_RANGES[priceRange]
  const { data, isLoading, isError } = useQuery({
    queryKey: ['store', game, condition, priceRange, graded, sort, debouncedSearch, page],
    queryFn: () => api.store.list({
      page: String(page),
      ...(game ? { game } : {}),
      ...(condition ? { condition } : {}),
      ...(pr.min ? { minPrice: pr.min } : {}),
      ...(pr.max ? { maxPrice: pr.max } : {}),
      ...(graded ? { graded } : {}),
      ...(sort ? { sort } : {}),
      ...(debouncedSearch ? { q: debouncedSearch } : {}),
    }),
  })

  const items: any[] = data?.items ?? []
  const totalPages: number = data?.totalPages ?? 1
  const total: number = data?.total ?? 0

  const activeFiltersCount = [
    game, condition, priceRange > 0 ? 'x' : '', graded, debouncedSearch
  ].filter(Boolean).length

  function clearFilters() {
    setGame(''); setCondition(''); setPriceRange(0); setGraded(''); setSearchInput('')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[var(--color-muted)] mb-5">
        <Link to="/" className="hover:text-white transition-colors">Inicio</Link>
        <span>/</span>
        <span className="text-white">Tienda Oficial</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Tienda Oficial</h1>
          <p className="text-[var(--color-muted)] text-sm mt-1">
            Singles, gradeados y sellados con garantía TradeUp
            {!isLoading && <span> · <span className="text-white">{total}</span> items</span>}
          </p>
        </div>
        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)]">
          <button
            onClick={() => setView('grid')}
            title="Vista cuadrícula"
            className={`p-2 rounded-md transition-all ${
              view === 'grid' ? 'bg-[var(--color-brand)] text-white' : 'text-[var(--color-muted)] hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
              <path d="M1 2.5A1.5 1.5 0 012.5 1h3A1.5 1.5 0 017 2.5v3A1.5 1.5 0 015.5 7h-3A1.5 1.5 0 011 5.5v-3zm8 0A1.5 1.5 0 0110.5 1h3A1.5 1.5 0 0115 2.5v3A1.5 1.5 0 0113.5 7h-3A1.5 1.5 0 019 5.5v-3zm-8 8A1.5 1.5 0 012.5 9h3A1.5 1.5 0 017 10.5v3A1.5 1.5 0 015.5 15h-3A1.5 1.5 0 011 13.5v-3zm8 0A1.5 1.5 0 0110.5 9h3A1.5 1.5 0 0115 10.5v3A1.5 1.5 0 0113.5 15h-3A1.5 1.5 0 019 13.5v-3z"/>
            </svg>
          </button>
          <button
            onClick={() => setView('list')}
            title="Vista lista"
            className={`p-2 rounded-md transition-all ${
              view === 'list' ? 'bg-[var(--color-brand)] text-white' : 'text-[var(--color-muted)] hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M2.5 12a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">🔍</span>
        <input
          type="text"
          placeholder="Buscar carta por nombre..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className="w-full pl-11 pr-10 py-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-white text-sm placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
        />
        {searchInput && (
          <button onClick={() => setSearchInput('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-white text-lg">&times;</button>
        )}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Game pills */}
        {GAMES.map(g => (
          <button key={g.value} onClick={() => setGame(g.value)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
              game === g.value
                ? 'bg-[var(--color-brand)] border-[var(--color-brand)] text-white'
                : 'bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-muted)] hover:text-white hover:border-[var(--color-brand)]/50'
            }`}>
            {g.label}
          </button>
        ))}
      </div>

      {/* Selects row */}
      <div className="flex flex-wrap gap-2 mb-5 items-center">
        {/* Condition */}
        <select value={condition} onChange={e => setCondition(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-brand)]">
          {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>

        {/* Price range */}
        <select value={priceRange} onChange={e => setPriceRange(Number(e.target.value))}
          className="px-3 py-2 rounded-xl text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-brand)]">
          {PRICE_RANGES.map((p, i) => <option key={i} value={i}>{p.label}</option>)}
        </select>

        {/* Grading */}
        <select value={graded} onChange={e => setGraded(e.target.value as any)}
          className="px-3 py-2 rounded-xl text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-brand)]">
          <option value="">Sin/Con grado</option>
          <option value="true">Solo gradeadas</option>
          <option value="false">Sin gradear</option>
        </select>

        {/* Sort */}
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-brand)] ml-auto">
          {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        {/* Clear filters */}
        {activeFiltersCount > 0 && (
          <button onClick={clearFilters}
            className="px-3 py-2 rounded-xl text-sm border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all">
            ✕ Limpiar ({activeFiltersCount})
          </button>
        )}
      </div>

      {/* Results */}
      {isLoading && (
        <div className={view === 'grid'
          ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
          : 'space-y-3'}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={view === 'grid'
              ? 'aspect-[3/4] rounded-[var(--radius-card)] bg-[var(--color-surface-2)] animate-pulse'
              : 'h-24 rounded-xl bg-[var(--color-surface-2)] animate-pulse'
            } />
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center py-20 text-[var(--color-muted)]">Error cargando la tienda.</div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🏪</p>
          <p className="text-[var(--color-muted)]">
            {activeFiltersCount > 0
              ? 'No hay items con esos filtros.'
              : 'La tienda está siendo abastecida. Vuelve pronto.'}
          </p>
          {activeFiltersCount > 0 && (
            <button onClick={clearFilters} className="mt-3 text-sm text-[var(--color-brand-light)] hover:underline">
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {!isLoading && !isError && items.length > 0 && (
        <>
          {view === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map(item => (
                <StoreCard
                  key={item._id}
                  item={item}
                  onView={() => setSelectedItem(item)}
                  onBuy={() => isSignedIn ? setCheckoutItem(item) : null}
                  isSignedIn={!!isSignedIn}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <StoreListRow
                  key={item._id}
                  item={item}
                  onView={() => setSelectedItem(item)}
                  onBuy={() => isSignedIn ? setCheckoutItem(item) : null}
                  isSignedIn={!!isSignedIn}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm rounded-xl border border-[var(--color-border)] text-[var(--color-muted)] hover:text-white disabled:opacity-40 transition-all"
              >
                ← Anterior
              </button>
              <span className="text-[var(--color-muted)] text-sm">
                Página <span className="text-white font-medium">{page}</span> de <span className="text-white font-medium">{totalPages}</span>
              </span>
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm rounded-xl border border-[var(--color-border)] text-[var(--color-muted)] hover:text-white disabled:opacity-40 transition-all"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      {/* Item detail modal */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          isSignedIn={!!isSignedIn}
          onClose={() => setSelectedItem(null)}
          onBuy={() => { setSelectedItem(null); setCheckoutItem(selectedItem) }}
        />
      )}

      {/* Stripe checkout modal */}
      {checkoutItem && (
        <StoreCheckoutModal
          item={checkoutItem}
          onClose={() => setCheckoutItem(null)}
          onSuccess={() => setCheckoutItem(null)}
        />
      )}
    </div>
  )
}

// ─── Grid Card ───────────────────────────────────────────────────────────────
function StoreCard({ item, onView, onBuy, isSignedIn }: {
  item: any; onView: () => void; onBuy: () => void; isSignedIn: boolean
}) {
  const image = item.photos?.[0] ?? item.catalogCard?.imageUrl ?? null
  const stockLabel = item.stock === 1
    ? '¡Última unidad!'
    : item.stock <= 5
    ? `¡Últimas ${item.stock}!`
    : `${item.stock} disponibles`
  const stockUrgent = item.stock <= 3

  return (
    <div className="rounded-[var(--radius-card)] bg-[var(--color-surface-2)] border border-[var(--color-border)] overflow-hidden card-glow group flex flex-col">
      <button onClick={onView} className="flex-1 text-left">
        <div className="aspect-[3/4] bg-[var(--color-surface-3)] relative overflow-hidden">
          {image
            ? <img src={image} alt={item.catalogCard?.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            : <div className="w-full h-full flex items-center justify-center text-4xl text-[var(--color-muted)]/20">🃏</div>}
          {/* Graded badge */}
          {item.isGraded && (
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-xs font-bold bg-yellow-400/95 text-black shadow">
              {item.gradeCompany} {item.gradeValue}
            </span>
          )}
          {/* Sealed badge */}
          {item.isSealed && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-xs font-bold bg-blue-500/90 text-white">Sellado</span>
          )}
          {/* Stock badge */}
          <span className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-xs font-medium ${
            stockUrgent ? 'bg-orange-500/90 text-white' : 'bg-black/60 text-white backdrop-blur-sm'
          }`}>
            {stockLabel}
          </span>
        </div>
        <div className="p-3">
          <p className="text-sm font-medium text-white truncate">{item.catalogCard?.name}</p>
          <p className="text-xs text-[var(--color-muted)] truncate mt-0.5">{item.catalogCard?.set}</p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-surface-3)] text-[var(--color-muted)] border border-[var(--color-border)]">
              {CONDITION_LABEL[item.condition] ?? item.condition}
            </span>
            <span className="text-sm font-bold text-[var(--color-brand-light)]">${(item.price / 100).toFixed(2)}</span>
          </div>
        </div>
      </button>
      {isSignedIn ? (
        <button onClick={onBuy}
          className="w-full py-2 bg-[var(--color-brand)]/20 border-t border-[var(--color-border)] text-[var(--color-brand-light)] text-sm font-medium hover:bg-[var(--color-brand)]/40 transition-all">
          Comprar
        </button>
      ) : (
        <SignInButton mode="modal">
          <button className="w-full py-2 bg-[var(--color-surface-3)] border-t border-[var(--color-border)] text-[var(--color-muted)] text-sm hover:text-white transition-all">
            Inicia sesión
          </button>
        </SignInButton>
      )}
    </div>
  )
}

// ─── List Row ─────────────────────────────────────────────────────────────────
function StoreListRow({ item, onView, onBuy, isSignedIn }: {
  item: any; onView: () => void; onBuy: () => void; isSignedIn: boolean
}) {
  const image = item.photos?.[0] ?? item.catalogCard?.imageUrl ?? null

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-brand)]/40 transition-colors">
      <button onClick={onView} className="w-14 h-20 rounded-lg overflow-hidden bg-[var(--color-surface-3)] shrink-0">
        {image
          ? <img src={image} alt={item.catalogCard?.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-xl text-[var(--color-muted)]/20">🃏</div>}
      </button>
      <button onClick={onView} className="flex-1 text-left min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <p className="text-sm font-semibold text-white">{item.catalogCard?.name}</p>
          {item.isGraded && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-400/90 text-black shrink-0">
              {item.gradeCompany} {item.gradeValue}
            </span>
          )}
          {item.isSealed && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/80 text-white shrink-0">Sellado</span>
          )}
        </div>
        <p className="text-xs text-[var(--color-muted)] mt-0.5">{item.catalogCard?.set} · {item.catalogCard?.rarity ?? ''}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-surface-3)] text-[var(--color-muted)] border border-[var(--color-border)]">
            {CONDITION_LABEL[item.condition] ?? item.condition}
          </span>
          <span className="text-xs text-[var(--color-muted)]">{item.stock} en stock</span>
        </div>
      </button>
      <div className="text-right shrink-0 space-y-2">
        <p className="text-lg font-bold text-[var(--color-brand-light)]">${(item.price / 100).toFixed(2)}</p>
        {isSignedIn ? (
          <button onClick={onBuy}
            className="px-4 py-1.5 rounded-xl bg-[var(--color-brand)]/20 border border-[var(--color-brand)]/40 text-[var(--color-brand-light)] text-sm font-medium hover:bg-[var(--color-brand)]/40 transition-all">
            Comprar
          </button>
        ) : (
          <SignInButton mode="modal">
            <button className="px-4 py-1.5 rounded-xl border border-[var(--color-border)] text-[var(--color-muted)] text-sm hover:text-white transition-all">
              Iniciar sesión
            </button>
          </SignInButton>
        )}
      </div>
    </div>
  )
}

// ─── Item Detail Modal ────────────────────────────────────────────────────────
function ItemDetailModal({ item, isSignedIn, onClose, onBuy }: {
  item: any; isSignedIn: boolean; onClose: () => void; onBuy: () => void
}) {
  const image = item.photos?.[0] ?? item.catalogCard?.imageUrl ?? null
  const card = item.catalogCard

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-2xl bg-[var(--color-surface-1)] border border-[var(--color-border)] overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <div className="sm:w-48 h-48 sm:h-auto bg-[var(--color-surface-3)] relative shrink-0">
            {image
              ? <img src={image} alt={card?.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-5xl text-[var(--color-muted)]/20">🃏</div>}
            {item.isGraded && (
              <span className="absolute top-3 right-3 px-2 py-1 rounded-lg text-sm font-bold bg-yellow-400 text-black shadow">
                {item.gradeCompany} {item.gradeValue}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 p-6 flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider">{card?.game}</p>
                <h2 className="font-display text-xl font-bold text-white mt-0.5">{card?.name}</h2>
                <p className="text-sm text-[var(--color-muted)] mt-0.5">{card?.set} · #{card?.cardNumber}</p>
              </div>
              <button onClick={onClose} className="text-[var(--color-muted)] hover:text-white text-2xl leading-none ml-4">&times;</button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { label: 'Condición',  value: CONDITION_LABEL[item.condition] ?? item.condition },
                { label: 'Rareza',     value: card?.rarity },
                { label: 'Stock',      value: `${item.stock} disponible${item.stock !== 1 ? 's' : ''}` },
                { label: 'Idioma',     value: (card?.language ?? 'EN').toUpperCase() },
                ...(card?.cardNumber ? [{ label: 'Nº colección', value: card.cardNumber }] : []),
                ...(item.isGraded ? [{ label: 'Grado', value: `${item.gradeCompany} ${item.gradeValue}` }] : []),
                ...(item.isSealed ? [{ label: 'Tipo', value: 'Sellado 🔒' }] : []),
              ].map(f => (
                <div key={f.label} className="p-2.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)]">
                  <p className="text-[10px] text-[var(--color-muted)] uppercase tracking-wider">{f.label}</p>
                  <p className="text-sm font-medium text-white mt-0.5 capitalize">{f.value ?? '—'}</p>
                </div>
              ))}
            </div>

            {/* Garantía TradeUp */}
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-500/10 border border-green-500/20 mb-4">
              <span className="text-green-400 text-sm">🛡️</span>
              <p className="text-xs text-green-400">Garantía TradeUp — autenticidad y condición verificada</p>
            </div>

            <div className="mt-auto">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[var(--color-muted)] text-sm">Precio</span>
                <span className="text-2xl font-bold text-[var(--color-brand-light)]">${(item.price / 100).toFixed(2)}</span>
              </div>
              {isSignedIn ? (
                <button onClick={onBuy}
                  className="w-full py-3 rounded-xl bg-[var(--color-brand)] text-white font-semibold hover:bg-[var(--color-brand)]/90 transition-all">
                  🛒 Comprar ahora
                </button>
              ) : (
                <SignInButton mode="modal">
                  <button className="w-full py-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-muted)] font-medium hover:text-white transition-all">
                    Inicia sesión para comprar
                  </button>
                </SignInButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
