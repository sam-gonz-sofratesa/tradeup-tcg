import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

export function NotFoundPage() {
  const navigate = useNavigate()
  const [count, setCount] = useState(5)

  useEffect(() => {
    if (count <= 0) { navigate('/'); return }
    const t = setTimeout(() => setCount(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [count, navigate])

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <p className="text-8xl mb-6">🃏</p>
      <h1 className="font-display text-4xl font-bold text-white mb-2">404</h1>
      <p className="text-[var(--color-muted)] mb-1">Esta página no existe.</p>
      <p className="text-[var(--color-muted)] text-sm mb-8">
        Redirigiendo al inicio en <span className="text-white font-medium">{count}</span>s...
      </p>
      <div className="flex gap-3">
        <Link
          to="/"
          className="px-5 py-2.5 rounded-xl bg-[var(--color-brand)] text-white text-sm font-semibold hover:bg-[var(--color-brand)]/90 transition-all"
        >
          Ir al inicio
        </Link>
        <Link
          to="/marketplace"
          className="px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-muted)] text-sm hover:text-white transition-all"
        >
          Marketplace
        </Link>
      </div>
    </div>
  )
}
