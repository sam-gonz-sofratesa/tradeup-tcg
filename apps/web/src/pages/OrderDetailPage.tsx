import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from '../lib/api'
import { useState } from 'react'

const STATUS_CFG: Record<string, { label: string; classes: string }> = {
  pending:   { label: 'Pendiente',   classes: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  completed: { label: 'Completado',  classes: 'bg-green-500/15 text-green-400 border-green-500/30' },
  failed:    { label: 'Fallido',     classes: 'bg-red-500/15 text-red-400 border-red-500/30' },
  refunded:  { label: 'Reembolsado', classes: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
}

const SHIPPING_STEPS = [
  { key: 'pending',   label: 'Procesando' },
  { key: 'preparing', label: 'Preparando' },
  { key: 'shipped',   label: 'Enviado' },
  { key: 'delivered', label: 'Entregado' },
]

function ShippingTracker({ current }: { current: string }) {
  const idx = SHIPPING_STEPS.findIndex(s => s.key === current)
  return (
    <div className="flex items-center gap-0 w-full">
      {SHIPPING_STEPS.map((step, i) => (
        <div key={step.key} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
              i <= idx
                ? 'bg-[var(--color-brand)] border-[var(--color-brand)] text-white'
                : 'border-[var(--color-border)] text-[var(--color-muted)]'
            }`}>
              {i < idx ? '✓' : i + 1}
            </div>
            <span className={`text-[10px] text-center leading-tight ${
              i <= idx ? 'text-white' : 'text-[var(--color-muted)]'
            }`}>{step.label}</span>
          </div>
          {i < SHIPPING_STEPS.length - 1 && (
            <div className={`h-0.5 flex-1 mx-1 mb-4 transition-all ${
              i < idx ? 'bg-[var(--color-brand)]' : 'bg-[var(--color-border)]'
            }`} />
          )}
        </div>
      ))}
    </div>
  )
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(s => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className={`text-2xl transition-transform hover:scale-110 ${
            s <= (hover || value) ? 'text-yellow-400' : 'text-[var(--color-muted)]/30'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const apiFn = useApi()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [reviewSent, setReviewSent] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => apiFn.transactions.get(id!),
    enabled: !!id,
  })

  const submitReview = useMutation({
    mutationFn: () => apiFn.transactions.review(id!, { rating, comment }),
    onSuccess: () => {
      setReviewSent(true)
      qc.invalidateQueries({ queryKey: ['transaction', id] })
    },
  })

  if (isLoading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-[var(--color-brand)] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (isError || !data?.transaction) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <p className="text-4xl mb-4">😕</p>
      <p className="text-[var(--color-muted)] mb-4">Pedido no encontrado.</p>
      <Link to="/orders" className="text-[var(--color-brand-light)] hover:underline">← Mis pedidos</Link>
    </div>
  )

  const { transaction: tx, myReview } = data
  const isB2C = tx.type === 'b2c'
  const snap = tx.storeItemSnapshot
  const statusCfg = STATUS_CFG[tx.status] ?? STATUS_CFG.pending
  const date = new Date(tx.createdAt).toLocaleDateString('es-PA', { day: '2-digit', month: 'long', year: 'numeric' })
  const canReview = tx.reviewEligible && !isB2C && !myReview && !reviewSent

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      <div className="flex items-center justify-between">
        <Link to="/orders" className="text-sm text-[var(--color-muted)] hover:text-white transition-colors">← Mis pedidos</Link>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusCfg.classes}`}>
          {statusCfg.label}
        </span>
      </div>

      {/* Carta / item */}
      <div className="p-5 rounded-2xl bg-[var(--color-surface-1)] border border-[var(--color-border)] flex gap-4">
        <div className="w-16 h-22 rounded-lg overflow-hidden bg-[var(--color-surface-3)] shrink-0">
          {(snap?.imageUrl || tx.offer?.listing?.catalogCard?.imageUrl) ? (
            <img
              src={snap?.imageUrl ?? tx.offer?.listing?.catalogCard?.imageUrl}
              alt={snap?.name ?? tx.offer?.listing?.catalogCard?.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">🃏</div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-white font-semibold">
            {snap?.name ?? tx.offer?.listing?.catalogCard?.name ?? 'Carta'}
          </p>
          <p className="text-[var(--color-muted)] text-sm mt-0.5">
            {snap?.set ?? tx.offer?.listing?.catalogCard?.set ?? ''}
          </p>
          {snap?.condition && (
            <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded bg-[var(--color-surface-3)] text-[var(--color-muted)] border border-[var(--color-border)]">
              {snap.condition}
            </span>
          )}
        </div>
        {tx.grossAmount && (
          <div className="text-right shrink-0">
            <p className="text-white font-bold text-lg">${(tx.grossAmount / 100).toFixed(2)}</p>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">USD</p>
          </div>
        )}
      </div>

      {/* Tracking de envío */}
      {tx.status === 'completed' && (
        <div className="p-5 rounded-2xl bg-[var(--color-surface-1)] border border-[var(--color-border)]">
          <h3 className="text-sm font-semibold text-white mb-4">📦 Estado de envío</h3>
          <ShippingTracker current={tx.shippingStatus ?? 'pending'} />
        </div>
      )}

      {/* Detalles */}
      <div className="p-5 rounded-2xl bg-[var(--color-surface-1)] border border-[var(--color-border)] space-y-3">
        <h3 className="text-sm font-semibold text-white">Detalles</h3>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-[var(--color-muted)]">Fecha</span>
          <span className="text-white text-right">{date}</span>
          <span className="text-[var(--color-muted)]">Tipo</span>
          <span className="text-white text-right capitalize">{tx.type.replace('_', ' ')}</span>
          <span className="text-[var(--color-muted)]">ID pedido</span>
          <span className="text-white text-right font-mono text-xs">{tx._id.slice(-10)}</span>
          {tx.stripePaymentIntentId && (
            <>
              <span className="text-[var(--color-muted)]">Stripe PI</span>
              <a
                href={`https://dashboard.stripe.com/test/payments/${tx.stripePaymentIntentId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-brand-light)] text-right text-xs hover:underline truncate"
              >
                {tx.stripePaymentIntentId.slice(-14)}
              </a>
            </>
          )}
        </div>
      </div>

      {/* Review */}
      {canReview && (
        <div className="p-5 rounded-2xl bg-[var(--color-surface-1)] border border-[var(--color-border)]">
          <h3 className="text-sm font-semibold text-white mb-3">⭐ Deja una reseña</h3>
          <StarPicker value={rating} onChange={setRating} />
          <textarea
            className="w-full mt-3 p-3 rounded-xl bg-[var(--color-surface-3)] border border-[var(--color-border)] text-sm text-white placeholder:text-[var(--color-muted)] resize-none focus:outline-none focus:border-[var(--color-brand)]"
            rows={3}
            maxLength={500}
            placeholder="Cuéntanos sobre la transacción... (opcional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          {submitReview.isError && (
            <p className="text-red-400 text-xs mt-1">{(submitReview.error as any)?.message}</p>
          )}
          <button
            onClick={() => submitReview.mutate()}
            disabled={rating === 0 || submitReview.isPending}
            className="mt-3 w-full py-2.5 rounded-xl bg-[var(--color-brand)] text-white text-sm font-semibold hover:bg-[var(--color-brand)]/90 disabled:opacity-50 transition-all"
          >
            {submitReview.isPending ? 'Enviando...' : 'Enviar reseña'}
          </button>
        </div>
      )}

      {reviewSent && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm text-center">
          ✅ Reseña enviada. ¡Gracias!
        </div>
      )}

      {myReview && (
        <div className="p-4 rounded-xl bg-[var(--color-surface-1)] border border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-muted)] mb-1">Tu reseña</p>
          <div className="flex gap-0.5 mb-1">
            {[1,2,3,4,5].map(s => (
              <span key={s} className={s <= myReview.rating ? 'text-yellow-400' : 'text-[var(--color-muted)]/30'}>★</span>
            ))}
          </div>
          {myReview.comment && <p className="text-sm text-white">{myReview.comment}</p>}
        </div>
      )}
    </div>
  )
}
