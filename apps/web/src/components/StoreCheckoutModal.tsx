import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useApi } from '../lib/api'
import { useNavigate } from 'react-router-dom'

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

function StorePaymentForm({ amount, onSuccess, onCancel }: {
  amount: number
  onSuccess: () => void
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
    } else if (paymentIntent?.status === 'succeeded') {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 rounded-xl bg-[var(--color-surface-3)] border border-[var(--color-border)]">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}
      {/* Botones siempre visibles al fondo del scroll */}
      <div className="flex gap-3 pt-1">
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

export function StoreCheckoutModal({ item, onClose, onSuccess }: {
  item: any
  onClose: () => void
  onSuccess: () => void
}) {
  const apiFn = useApi()
  const navigate = useNavigate()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loadError, setLoadError] = useState('')
  const [purchased, setPurchased] = useState(false)

  const image = item.photos?.[0] ?? item.catalogCard?.imageUrl ?? null

  useEffect(() => {
    apiFn.payments.storeIntent({ storeItemId: item._id })
      .then((data: any) => setClientSecret(data.clientSecret))
      .catch((err: any) => setLoadError(err.message ?? 'Error iniciando pago'))
  }, [item._id])

  function handleSuccess() {
    setPurchased(true)
    setTimeout(() => {
      onSuccess()
      navigate('/dashboard')
    }, 2500)
  }

  return (
    // Overlay: flex centrado, pero permite scroll en pantallas pequeñas
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 bg-black/70 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      {/* Modal: crece con el contenido, no tiene max-height fijo */}
      <div
        className="w-full max-w-md rounded-2xl bg-[var(--color-surface-1)] border border-[var(--color-border)] p-6 shadow-2xl mb-8"
        onClick={(e) => e.stopPropagation()}
      >
        {purchased ? (
          <div className="text-center py-8">
            <p className="text-5xl mb-4">🎉</p>
            <h2 className="font-display text-xl font-bold text-white mb-2">¡Compra exitosa!</h2>
            <p className="text-[var(--color-muted)] text-sm">Tu carta está en camino. Redirigiendo al dashboard...</p>
          </div>
        ) : (
          <>
            {/* Header — sticky para que siempre sea visible */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-20 rounded-lg overflow-hidden bg-[var(--color-surface-3)] shrink-0">
                {image
                  ? <img src={image} alt={item.catalogCard?.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl">🃏</div>}
              </div>
              <div className="flex-1">
                <h2 className="font-display text-lg font-bold text-white">{item.catalogCard?.name}</h2>
                <p className="text-[var(--color-muted)] text-sm">{item.catalogCard?.set}</p>
                {item.isGraded && (
                  <span className="text-xs font-bold text-yellow-400">{item.gradeCompany} {item.gradeValue}</span>
                )}
              </div>
              <button onClick={onClose} className="text-[var(--color-muted)] hover:text-white text-2xl shrink-0">&times;</button>
            </div>

            {/* Resumen de precio */}
            <div className="flex justify-between items-center p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] mb-4">
              <div className="text-sm text-[var(--color-muted)]">
                <p>Subtotal</p>
                <p className="mt-0.5">Envío</p>
              </div>
              <div className="text-sm text-right">
                <p className="text-white font-medium">${(item.price / 100).toFixed(2)}</p>
                <p className="text-green-400">Gratis</p>
              </div>
            </div>

            <div className="flex justify-between items-center mb-5">
              <span className="font-medium text-white">Total</span>
              <span className="text-2xl font-bold text-[var(--color-brand-light)]">${(item.price / 100).toFixed(2)}</span>
            </div>

            {loadError && <p className="text-red-400 text-sm mb-4">{loadError}</p>}

            {!clientSecret && !loadError && (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-[var(--color-brand)] border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret, appearance: STRIPE_APPEARANCE }}>
                <StorePaymentForm
                  amount={item.price}
                  onSuccess={handleSuccess}
                  onCancel={onClose}
                />
              </Elements>
            )}

            <p className="text-xs text-[var(--color-muted)] text-center mt-4">
              🔒 Pago seguro con Stripe
            </p>
          </>
        )}
      </div>
    </div>
  )
}
