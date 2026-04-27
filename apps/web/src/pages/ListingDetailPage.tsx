import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { api, useApi } from '../lib/api'
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react'

const CONDITION_LABELS: Record<string, string> = {
  mint: 'Mint', near_mint: 'Near Mint', excellent: 'Excellent',
  good: 'Good', played: 'Played', poor: 'Poor',
}

export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const apiFn = useApi()
  const [offerType, setOfferType] = useState<'money' | 'cards' | 'mixed' | null>(null)
  const [moneyAmount, setMoneyAmount] = useState('')
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => api.listings.get(id!),
    enabled: !!id,
  })

  const listing = data?.listing
  const card = listing?.catalogCard
  // Prioridad: foto subida → imageUrl del catálogo
  const image = listing?.photos?.[0] ?? card?.imageUrl ?? null

  async function sendOffer() {
    if (!offerType) return
    setSending(true)
    setError('')
    try {
      await apiFn.offers.create({
        listingId: id,
        type: offerType,
        ...(moneyAmount ? { moneyAmount: Math.round(parseFloat(moneyAmount) * 100) } : {}),
      })
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  if (isLoading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-[var(--color-brand)] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (isError || !listing) return (
    <div className="max-w-5xl mx-auto px-4 py-16 text-center">
      <p className="text-4xl mb-4">😕</p>
      <p className="text-[var(--color-muted)]">Listing no encontrado.</p>
      <Link to="/marketplace" className="text-[var(--color-brand-light)] hover:underline mt-4 inline-block">← Volver</Link>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Link to="/marketplace" className="text-sm text-[var(--color-muted)] hover:text-white transition-colors mb-6 inline-block">← Volver al marketplace</Link>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Photo */}
        <div>
          <div className="aspect-[3/4] rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] overflow-hidden">
            {image
              ? <img src={image} alt={card?.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-6xl text-[var(--color-muted)]/20">🃏</div>}
          </div>
          {/* Miniaturas de fotos adicionales */}
          {listing.photos?.length > 1 && (
            <div className="flex gap-2 mt-2">
              {listing.photos.map((p: string, i: number) => (
                <div key={i} className="w-16 h-20 rounded-lg overflow-hidden border border-[var(--color-border)]">
                  <img src={p} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-1">{card?.game}</p>
          <h1 className="font-display text-2xl font-bold text-white mb-1">{card?.name}</h1>
          <p className="text-[var(--color-muted)] text-sm mb-6">{card?.set}{card?.cardNumber ? ` · #${card.cardNumber}` : ''}{card?.rarity ? ` · ${card.rarity}` : ''}</p>

          <div className="flex items-center gap-4 mb-6">
            <span className="px-3 py-1 rounded-lg bg-[var(--color-surface-3)] border border-[var(--color-border)] text-sm">
              {CONDITION_LABELS[listing.condition] ?? listing.condition}
            </span>
            {listing.askingPrice && (
              <span className="text-2xl font-bold text-[var(--color-brand-light)]">${(listing.askingPrice / 100).toFixed(2)}</span>
            )}
            {!listing.askingPrice && (
              <span className="text-sm text-blue-400">↔ Solo trade</span>
            )}
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] mb-6">
            <div className="w-10 h-10 rounded-full bg-[var(--color-brand)]/20 flex items-center justify-center text-lg">👤</div>
            <div>
              <p className="text-sm font-medium text-white">{listing.seller?.username}</p>
              <p className="text-xs text-[var(--color-muted)]">⭐ {listing.seller?.reputation?.toFixed(1) ?? '–'} · {listing.seller?.reviewCount ?? 0} reviews</p>
            </div>
          </div>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="w-full py-3 rounded-xl bg-[var(--color-brand)] text-white font-semibold hover:bg-[var(--color-brand)]/90 transition-all">
                Inicia sesión para hacer una oferta
              </button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            {success ? (
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm text-center">✅ Oferta enviada exitosamente</div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium text-white">Hacer una oferta</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['money', 'cards', 'mixed'] as const).map((t) => (
                    <button key={t} onClick={() => setOfferType(t)}
                      className={`py-2 rounded-lg text-sm border transition-all ${
                        offerType === t
                          ? 'bg-[var(--color-brand)] border-[var(--color-brand)] text-white'
                          : 'bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-muted)] hover:text-white'
                      }`}>
                      {t === 'money' ? '💵 Dinero' : t === 'cards' ? '🃏 Cartas' : '🔀 Mixta'}
                    </button>
                  ))}
                </div>
                {(offerType === 'money' || offerType === 'mixed') && (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] text-sm">$</span>
                    <input type="number" placeholder="0.00" value={moneyAmount} onChange={(e) => setMoneyAmount(e.target.value)}
                      className="w-full pl-7 pr-4 py-2.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-white text-sm focus:outline-none focus:border-[var(--color-brand)] transition-colors" />
                  </div>
                )}
                {error && <p className="text-red-400 text-xs">{error}</p>}
                <button onClick={sendOffer} disabled={!offerType || sending}
                  className="w-full py-3 rounded-xl bg-[var(--color-brand)] text-white font-semibold hover:bg-[var(--color-brand)]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {sending ? 'Enviando...' : 'Enviar oferta'}
                </button>
              </div>
            )}
          </SignedIn>
        </div>
      </div>
    </div>
  )
}
