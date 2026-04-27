import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { SignInButton } from '@clerk/clerk-react'
import { api, useApi } from '../lib/api'
import { StoreCheckoutModal } from '../components/StoreCheckoutModal'

const GAMES = [
  { value: '', label: 'Todos' },
  { value: 'pokemon', label: 'Pokémon' },
  { value: 'yugioh', label: 'Yu-Gi-Oh!' },
  { value: 'onepiece', label: 'One Piece' },
  { value: 'dragonball', label: 'Dragon Ball' },
  { value: 'mtg', label: 'MTG' },
]

const CONDITION_LABEL: Record<string, string> = {
  mint: 'Mint', near_mint: 'NM', excellent: 'EX', good: 'Good', played: 'PL', poor: 'Poor',
}

export function StorePage() {
  const [game, setGame] = useState('')
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [checkoutItem, setCheckoutItem] = useState<any | null>(null)
  const { isSignedIn } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['store', game],
    queryFn: () => api.store.list(game ? { game } : undefined),
  })
  const items: any[] = data?.items ?? []

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white mb-1">Tienda Oficial</h1>
        <p className="text-[var(--color-muted)] text-sm">
          Singles, gradeados y sellados con garantía TradeUp · {data?.total ?? '...'} items
        </p>
      </div>

      {/* Filtro de juego */}
      <div className="flex gap-2 flex-wrap mb-8">
        {GAMES.map((g) => (
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

      {/* Grid */}
      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-[var(--radius-card)] bg-[var(--color-surface-2)] animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🏪</p>
          <p className="text-[var(--color-muted)]">La tienda está siendo abastecida. Vuelve pronto.</p>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item: any) => (
            <StoreCard
              key={item._id}
              item={item}
              onView={() => setSelectedItem(item)}
              onBuy={() => isSignedIn ? setCheckoutItem(item) : null}
              isSignedIn={!!isSignedIn}
            />
          ))}
        </div>
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
          onSuccess={() => {
            setCheckoutItem(null)
            // Podrias redirigir a /dashboard o mostrar un toast
          }}
        />
      )}
    </div>
  )
}

// ─── Store Card ─────────────────────────────────────────────────────────────────
function StoreCard({ item, onView, onBuy, isSignedIn }: {
  item: any; onView: () => void; onBuy: () => void; isSignedIn: boolean
}) {
  const image = item.photos?.[0] ?? item.catalogCard?.imageUrl ?? null

  return (
    <div className="rounded-[var(--radius-card)] bg-[var(--color-surface-2)] border border-[var(--color-border)] overflow-hidden card-glow group">
      <button onClick={onView} className="w-full text-left">
        <div className="aspect-[3/4] bg-[var(--color-surface-3)] relative overflow-hidden">
          {image
            ? <img src={image} alt={item.catalogCard?.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            : <div className="w-full h-full flex items-center justify-center text-4xl text-[var(--color-muted)]/20">🃏</div>}
          {item.isGraded && (
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-xs font-bold bg-yellow-500/90 text-black">
              {item.gradeCompany} {item.gradeValue}
            </span>
          )}
          {item.isSealed && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-xs font-bold bg-blue-500/90 text-white">Sellado</span>
          )}
          {item.stock <= 3 && item.stock > 0 && (
            <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-xs bg-orange-500/80 text-white">
              ¡Últimas {item.stock}!
            </span>
          )}
        </div>
        <div className="p-3">
          <p className="text-sm font-medium text-white truncate">{item.catalogCard?.name}</p>
          <p className="text-xs text-[var(--color-muted)] truncate mt-0.5">{item.catalogCard?.set}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-[var(--color-muted)]">{CONDITION_LABEL[item.condition] ?? item.condition}</span>
            <span className="text-sm font-bold text-[var(--color-brand-light)]">${(item.price / 100).toFixed(2)}</span>
          </div>
        </div>
      </button>

      {/* Buy button */}
      {isSignedIn ? (
        <button onClick={onBuy}
          className="w-full py-2 bg-[var(--color-brand)]/20 border-t border-[var(--color-border)] text-[var(--color-brand-light)] text-sm font-medium hover:bg-[var(--color-brand)]/40 transition-all">
          Comprar
        </button>
      ) : (
        <SignInButton mode="modal">
          <button className="w-full py-2 bg-[var(--color-surface-3)] border-t border-[var(--color-border)] text-[var(--color-muted)] text-sm hover:text-white transition-all">
            Inicia sesión para comprar
          </button>
        </SignInButton>
      )}
    </div>
  )
}

// ─── Item Detail Modal ─────────────────────────────────────────────────────────
function ItemDetailModal({ item, isSignedIn, onClose, onBuy }: {
  item: any; isSignedIn: boolean; onClose: () => void; onBuy: () => void
}) {
  const image = item.photos?.[0] ?? item.catalogCard?.imageUrl ?? null
  const card = item.catalogCard

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-[var(--color-surface-1)] border border-[var(--color-border)] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex">
          {/* Imagen */}
          <div className="w-48 shrink-0 bg-[var(--color-surface-3)] relative">
            {image
              ? <img src={image} alt={card?.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-5xl text-[var(--color-muted)]/20">🃏</div>}
            {item.isGraded && (
              <span className="absolute top-3 right-3 px-2 py-1 rounded-lg text-sm font-bold bg-yellow-500 text-black">
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
              <button onClick={onClose} className="text-[var(--color-muted)] hover:text-white text-2xl leading-none">&times;</button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'Condición', value: CONDITION_LABEL[item.condition] ?? item.condition },
                { label: 'Rareza', value: card?.rarity },
                { label: 'Stock', value: `${item.stock} disponible${item.stock !== 1 ? 's' : ''}` },
                { label: 'Idioma', value: card?.language?.toUpperCase() ?? 'EN' },
                ...(item.isGraded ? [{ label: 'Grado', value: `${item.gradeCompany} ${item.gradeValue}` }] : []),
                ...(item.isSealed ? [{ label: 'Tipo', value: 'Sellado 🔒' }] : []),
              ].map((f) => (
                <div key={f.label} className="p-3 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)]">
                  <p className="text-xs text-[var(--color-muted)]">{f.label}</p>
                  <p className="text-sm font-medium text-white mt-0.5 capitalize">{f.value ?? '—'}</p>
                </div>
              ))}
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
