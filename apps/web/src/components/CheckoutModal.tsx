import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { useApi } from '../lib/api'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '')

const STRIPE_APPEARANCE = {
  theme: 'night' as const,
  variables: {
    colorPrimary: '#7c3aed',
    colorBackground: '#1a1a2e',
    colorText: '#e2e8f0',
    colorDanger: '#f87171',
    fontFamily: 'Inter, system-ui, sans-serif',
    borderRadius: '10px',
  },
}

// ─── Inner form (needs Elements context) ────────────────────────────────────
function CheckoutForm({
  amount,
  onSuccess,
  onCancel,
}: {
  amount: number
  onSuccess: (paymentIntentId: string) => void
  onCancel: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setProcessing(true)
    setErrorMsg('')

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    })

    if (error) {
      setErrorMsg(error.message ?? 'Error procesando el pago')
      setProcessing(false)
    } else if (paymentIntent) {
      onSuccess(paymentIntent.id)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="p-4 rounded-xl bg-[var(--color-surface-3)] border border-[var(--color-border)]">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      {errorMsg && (
        <p className="text-red-400 text-sm">{errorMsg}</p>
      )}
      <div className="flex gap-3">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-muted)] text-sm hover:text-white transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={processing || !stripe}
          className="flex-1 py-2.5 rounded-xl bg-[var(--color-brand)] text-white font-semibold text-sm hover:bg-[var(--color-brand)]/90 transition-all disabled:opacity-50">
          {processing ? 'Procesando...' : `Pagar $${(amount / 100).toFixed(2)}`}
        </button>
      </div>
    </form>
  )
}

// ─── Modal wrapper ───────────────────────────────────────────────────────────
export function CheckoutModal({
  listingId,
  amount,         // in cents
  cardName,
  onSuccess,
  onClose,
}: {
  listingId: string
  amount: number
  cardName: string
  onSuccess: (paymentIntentId: string) => void
  onClose: () => void
}) {
  const apiFn = useApi()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    apiFn.payments.c2cIntent({ listingId, amount })
      .then((data: any) => setClientSecret(data.clientSecret))
      .catch((err: any) => setLoadError(err.message ?? 'Error cargando pago'))
  }, [listingId, amount])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-[var(--color-surface-1)] border border-[var(--color-border)] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display text-lg font-bold text-white">Confirmar pago</h2>
            <p className="text-[var(--color-muted)] text-sm mt-0.5">{cardName}</p>
          </div>
          <button onClick={onClose} className="text-[var(--color-muted)] hover:text-white text-xl leading-none">&times;</button>
        </div>

        <div className="flex justify-between items-center mb-5 p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)]">
          <span className="text-sm text-[var(--color-muted)]">Total</span>
          <span className="text-xl font-bold text-white">${(amount / 100).toFixed(2)}</span>
        </div>

        {loadError && (
          <p className="text-red-400 text-sm mb-4">{loadError}</p>
        )}

        {!clientSecret && !loadError && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-[var(--color-brand)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: STRIPE_APPEARANCE }}>
            <CheckoutForm amount={amount} onSuccess={onSuccess} onCancel={onClose} />
          </Elements>
        )}

        <p className="text-xs text-[var(--color-muted)] text-center mt-4">
          🔒 Pago seguro con Stripe. TradeUp cobra un 8% de comisión.
        </p>
      </div>
    </div>
  )
}
