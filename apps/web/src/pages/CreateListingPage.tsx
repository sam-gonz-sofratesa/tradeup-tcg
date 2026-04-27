import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api, useApi } from '../lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────
interface CatalogCard {
  _id: string
  name: string
  game: string
  set: string
  cardNumber?: string
  rarity?: string
  imageUrl?: string
}

const CONDITIONS = [
  { value: 'mint', label: 'Mint', desc: 'Perfecta, nunca jugada' },
  { value: 'near_mint', label: 'Near Mint', desc: 'Mínimo desgaste, casi perfecta' },
  { value: 'excellent', label: 'Excellent', desc: 'Pequeñas marcas, bien conservada' },
  { value: 'good', label: 'Good', desc: 'Uso visible pero jugable' },
  { value: 'played', label: 'Played', desc: 'Desgaste notable, funcional' },
  { value: 'poor', label: 'Poor', desc: 'Muy deteriorada' },
] as const

type Condition = typeof CONDITIONS[number]['value']

// ─── Step indicator ───────────────────────────────────────────────────────────
function Steps({ current }: { current: number }) {
  const steps = ['Carta', 'Condición y precio', 'Fotos', 'Confirmar']
  return (
    <div className="flex items-center gap-2 mb-10">
      {steps.map((s, i) => (
        <>
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              i < current ? 'bg-[var(--color-brand)] text-white'
              : i === current ? 'bg-[var(--color-brand)]/20 border border-[var(--color-brand)] text-[var(--color-brand-light)]'
              : 'bg-[var(--color-surface-3)] border border-[var(--color-border)] text-[var(--color-muted)]'
            }`}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className={`text-sm hidden sm:block ${
              i === current ? 'text-white font-medium' : 'text-[var(--color-muted)]'
            }`}>{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div key={`sep-${i}`} className={`flex-1 h-px ${
              i < current ? 'bg-[var(--color-brand)]' : 'bg-[var(--color-border)]'
            }`} />
          )}
        </>
      ))}
    </div>
  )
}

// ─── Step 1: Catalog search ───────────────────────────────────────────────────
function Step1({ onSelect }: { onSelect: (card: CatalogCard) => void }) {
  const [q, setQ] = useState('')
  const [game, setGame] = useState('')

  const { data, isFetching } = useQuery({
    queryKey: ['catalog-search', q, game],
    queryFn: () => api.catalog.search(q, game || undefined),
    enabled: q.trim().length >= 2,
    staleTime: 1000 * 30,
  })

  const cards: CatalogCard[] = data?.cards ?? []

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-white mb-6">¿Qué carta quieres publicar?</h2>
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Busca por nombre (ej: Charizard, Blue-Eyes...)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-white text-sm placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
          autoFocus
        />
        <select
          value={game}
          onChange={(e) => setGame(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
        >
          <option value="">Todos los juegos</option>
          <option value="pokemon">Pokémon</option>
          <option value="yugioh">Yu-Gi-Oh!</option>
          <option value="onepiece">One Piece</option>
          <option value="dragonball">Dragon Ball</option>
          <option value="mtg">MTG</option>
        </select>
      </div>

      {q.trim().length >= 2 && (
        <div className="space-y-2">
          {isFetching && (
            <div className="flex gap-2 items-center text-sm text-[var(--color-muted)] py-4">
              <div className="w-4 h-4 border border-[var(--color-brand)] border-t-transparent rounded-full animate-spin" />
              Buscando...
            </div>
          )}
          {!isFetching && cards.length === 0 && (
            <p className="text-sm text-[var(--color-muted)] py-4 text-center">No se encontraron cartas. ¿Está en el catálogo?</p>
          )}
          {cards.map((card) => (
            <button
              key={card._id}
              onClick={() => onSelect(card)}
              className="w-full flex items-center gap-4 p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-brand)]/60 hover:bg-[var(--color-surface-3)] transition-all text-left group"
            >
              <div className="w-12 h-16 rounded-lg bg-[var(--color-surface-3)] overflow-hidden shrink-0">
                {card.imageUrl
                  ? <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-xl text-[var(--color-muted)]/30">🃏</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white group-hover:text-[var(--color-brand-light)] transition-colors truncate">{card.name}</p>
                <p className="text-xs text-[var(--color-muted)] mt-0.5 truncate">{card.set}{card.cardNumber ? ` · #${card.cardNumber}` : ''}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--color-surface-3)] border border-[var(--color-border)] text-[var(--color-muted)] uppercase tracking-wide">{card.game}</span>
                  {card.rarity && <span className="text-[10px] text-[var(--color-muted)]">{card.rarity}</span>}
                </div>
              </div>
              <span className="text-[var(--color-muted)] group-hover:text-white transition-colors text-lg">→</span>
            </button>
          ))}
        </div>
      )}
      {q.trim().length < 2 && (
        <div className="text-center py-12 text-[var(--color-muted)]">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm">Escribe al menos 2 caracteres para buscar</p>
        </div>
      )}
    </div>
  )
}

// ─── Step 2: Condition + Price ────────────────────────────────────────────────
function Step2({
  card,
  condition, setCondition,
  price, setPrice,
  acceptsTrades, setAcceptsTrades,
  onNext, onBack,
}: {
  card: CatalogCard
  condition: Condition | ''
  setCondition: (v: Condition) => void
  price: string
  setPrice: (v: string) => void
  acceptsTrades: boolean
  setAcceptsTrades: (v: boolean) => void
  onNext: () => void
  onBack: () => void
}) {
  const canContinue = condition !== ''

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-white mb-2">Condición y precio</h2>
      <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] mb-6">
        <div className="w-10 h-14 rounded bg-[var(--color-surface-3)] overflow-hidden shrink-0">
          {card.imageUrl
            ? <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-lg">🃏</div>}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{card.name}</p>
          <p className="text-xs text-[var(--color-muted)]">{card.set}</p>
        </div>
      </div>

      <p className="text-sm font-medium text-white mb-3">Condición *</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
        {CONDITIONS.map((c) => (
          <button
            key={c.value}
            onClick={() => setCondition(c.value)}
            className={`p-3 rounded-xl border text-left transition-all ${
              condition === c.value
                ? 'bg-[var(--color-brand)]/15 border-[var(--color-brand)] text-white'
                : 'bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-brand)]/40 hover:text-white'
            }`}
          >
            <p className="text-sm font-semibold">{c.label}</p>
            <p className="text-[10px] mt-0.5 opacity-70">{c.desc}</p>
          </button>
        ))}
      </div>

      <p className="text-sm font-medium text-white mb-3">Precio (opcional)</p>
      <div className="relative mb-2">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] text-sm">$</span>
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full pl-7 pr-4 py-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-white text-sm focus:outline-none focus:border-[var(--color-brand)] transition-colors"
        />
      </div>
      <p className="text-xs text-[var(--color-muted)] mb-6">Déjalo vacío si solo aceptas intercambios.</p>

      <label className="flex items-center gap-3 cursor-pointer mb-8">
        <div
          onClick={() => setAcceptsTrades(!acceptsTrades)}
          className={`w-10 h-6 rounded-full transition-colors relative ${
            acceptsTrades ? 'bg-[var(--color-brand)]' : 'bg-[var(--color-surface-3)] border border-[var(--color-border)]'
          }`}
        >
          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
            acceptsTrades ? 'translate-x-5' : 'translate-x-1'
          }`} />
        </div>
        <div>
          <p className="text-sm text-white">Acepto intercambios de cartas</p>
          <p className="text-xs text-[var(--color-muted)]">Los compradores podrán ofrecerte cartas en cambio</p>
        </div>
      </label>

      <div className="flex gap-3">
        <button onClick={onBack} className="px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-muted)] text-sm hover:text-white hover:border-[var(--color-brand)]/50 transition-all">
          Atrás
        </button>
        <button onClick={onNext} disabled={!canContinue} className="flex-1 py-2.5 rounded-xl bg-[var(--color-brand)] text-white text-sm font-semibold hover:bg-[var(--color-brand)]/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
          Continuar →
        </button>
      </div>
    </div>
  )
}

// ─── Step 3: Photos ────────────────────────────────────────────────────────────
function Step3({
  photos, setPhotos, onNext, onBack,
}: {
  photos: File[]
  setPhotos: (files: File[]) => void
  onNext: () => void
  onBack: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const addFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return
    const valid = Array.from(newFiles).filter(
      (f) => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type) && f.size <= 4 * 1024 * 1024
    )
    setPhotos([...photos, ...valid].slice(0, 5))
  }, [photos, setPhotos])

  const removePhoto = (i: number) => setPhotos(photos.filter((_, idx) => idx !== i))

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-white mb-2">Fotos de tu carta</h2>
      <p className="text-sm text-[var(--color-muted)] mb-6">Hasta 5 fotos · JPG, PNG o WEBP · máx. 4MB por foto</p>

      <div
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files) }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all mb-4 ${
          dragOver
            ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/5'
            : 'border-[var(--color-border)] hover:border-[var(--color-brand)]/50 hover:bg-[var(--color-surface-2)]'
        }`}
      >
        <p className="text-3xl mb-2">📷</p>
        <p className="text-sm text-white font-medium">Arrastra fotos aquí o haz clic</p>
        <p className="text-xs text-[var(--color-muted)] mt-1">{photos.length}/5 fotos agregadas</p>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-5 gap-2 mb-6">
          {photos.map((file, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-[var(--color-surface-2)] border border-[var(--color-border)] group">
              <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removePhoto(i)}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-lg"
              >✕</button>
              {i === 0 && <span className="absolute bottom-1 left-1 px-1 py-0.5 rounded text-[9px] bg-black/70 text-white">Principal</span>}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack} className="px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-muted)] text-sm hover:text-white transition-all">
          Atrás
        </button>
        <button onClick={onNext} disabled={photos.length === 0} className="flex-1 py-2.5 rounded-xl bg-[var(--color-brand)] text-white text-sm font-semibold hover:bg-[var(--color-brand)]/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
          Continuar →
        </button>
      </div>
    </div>
  )
}

// ─── Step 4: Confirm ──────────────────────────────────────────────────────────
function Step4({
  card, condition, price, acceptsTrades, photos, onBack, onSubmit, isPending, error,
}: {
  card: CatalogCard
  condition: Condition
  price: string
  acceptsTrades: boolean
  photos: File[]
  onBack: () => void
  onSubmit: () => void
  isPending: boolean
  error: string
}) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold text-white mb-6">Confirmar publicación</h2>
      <div className="space-y-4 mb-8">
        <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)]">
          <div className="w-14 h-20 rounded-lg bg-[var(--color-surface-3)] overflow-hidden shrink-0">
            {card.imageUrl
              ? <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-2xl">🃏</div>}
          </div>
          <div>
            <p className="font-semibold text-white">{card.name}</p>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">{card.set} · {card.game}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="px-2 py-0.5 rounded-md text-xs bg-[var(--color-surface-3)] border border-[var(--color-border)] text-[var(--color-muted)]">{condition}</span>
              {price ? (
                <span className="text-sm font-bold text-[var(--color-brand-light)]">${parseFloat(price).toFixed(2)}</span>
              ) : (
                <span className="text-xs text-[var(--color-muted)]">Solo trade</span>
              )}
              {acceptsTrades && <span className="text-xs text-blue-400">↔ Acepta trades</span>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {photos.map((f, i) => (
            <div key={i} className="aspect-square rounded-lg overflow-hidden bg-[var(--color-surface-2)] border border-[var(--color-border)]">
              <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">{error}</p>}

      <div className="flex gap-3">
        <button onClick={onBack} disabled={isPending} className="px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-muted)] text-sm hover:text-white transition-all disabled:opacity-40">
          Atrás
        </button>
        <button onClick={onSubmit} disabled={isPending} className="flex-1 py-2.5 rounded-xl bg-[var(--color-brand)] text-white text-sm font-semibold hover:bg-[var(--color-brand)]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Publicando...
            </span>
          ) : '🚀 Publicar listing'}
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function CreateListingPage() {
  const navigate = useNavigate()
  const apiFn = useApi()

  const [step, setStep] = useState(0)
  const [selectedCard, setSelectedCard] = useState<CatalogCard | null>(null)
  const [condition, setCondition] = useState<Condition | ''>('')
  const [price, setPrice] = useState('')
  const [acceptsTrades, setAcceptsTrades] = useState(true)
  const [photos, setPhotos] = useState<File[]>([])
  const [submitError, setSubmitError] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      const form = new FormData()
      form.append('catalogCardId', selectedCard!._id)
      form.append('condition', condition)
      if (price) form.append('askingPrice', String(Math.round(parseFloat(price) * 100)))
      form.append('wantsCards', acceptsTrades ? '[]' : '[]') // puede ampliarse luego
      photos.forEach((f) => form.append('photos', f))
      return apiFn.listings.create(form)
    },
    onSuccess: (data: any) => {
      navigate(`/listings/${data.listing._id}`)
    },
    onError: (err: any) => {
      setSubmitError(err.message ?? 'Error al publicar. Intenta de nuevo.')
    },
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-white mb-2">Publicar carta</h1>
      <p className="text-[var(--color-muted)] text-sm mb-8">Tu carta estará visible en el marketplace en segundos.</p>

      <Steps current={step} />

      {step === 0 && (
        <Step1 onSelect={(card) => { setSelectedCard(card); setStep(1) }} />
      )}
      {step === 1 && selectedCard && (
        <Step2
          card={selectedCard}
          condition={condition} setCondition={setCondition}
          price={price} setPrice={setPrice}
          acceptsTrades={acceptsTrades} setAcceptsTrades={setAcceptsTrades}
          onNext={() => setStep(2)}
          onBack={() => setStep(0)}
        />
      )}
      {step === 2 && (
        <Step3
          photos={photos} setPhotos={setPhotos}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && selectedCard && condition && (
        <Step4
          card={selectedCard}
          condition={condition as Condition}
          price={price}
          acceptsTrades={acceptsTrades}
          photos={photos}
          onBack={() => setStep(2)}
          onSubmit={() => mutation.mutate()}
          isPending={mutation.isPending}
          error={submitError}
        />
      )}
    </div>
  )
}
