import { useEffect, useState } from 'react'
import { useApi } from '../lib/api'
import { Link } from 'react-router-dom'

type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded'
type TransactionType = 'b2c' | 'c2c_money' | 'c2c_trade' | 'c2c_mixed'

interface Transaction {
  _id: string
  type: TransactionType
  status: TransactionStatus
  grossAmount?: number
  stripePaymentIntentId?: string
  buyer: { _id: string; username: string }
  seller?: { _id: string; username: string }
  storeItemSnapshot?: { name?: string; imageUrl?: string }
  createdAt: string
}

const STATUS_CONFIG: Record<TransactionStatus, { label: string; classes: string; dot: string }> = {
  pending:   { label: 'Pendiente',   classes: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', dot: 'bg-yellow-400' },
  completed: { label: 'Completado',  classes: 'bg-green-500/15 text-green-400 border-green-500/30',   dot: 'bg-green-400' },
  failed:    { label: 'Fallido',     classes: 'bg-red-500/15 text-red-400 border-red-500/30',         dot: 'bg-red-400' },
  refunded:  { label: 'Reembolsado', classes: 'bg-blue-500/15 text-blue-400 border-blue-500/30',     dot: 'bg-blue-400' },
}

const TYPE_LABEL: Record<TransactionType, string> = {
  b2c: 'Compra en tienda',
  c2c_money: 'Oferta dinero',
  c2c_trade: 'Intercambio',
  c2c_mixed: 'Oferta mixta',
}

function StatusBadge({ status }: { status: TransactionStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

export function OrdersPage() {
  const apiFn = useApi()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')

  useEffect(() => {
    setLoading(true)
    const params: Record<string, any> = { page }
    if (typeFilter) params.type = typeFilter
    apiFn.transactions.me(params)
      .then((data: any) => {
        setTransactions(data.transactions)
        setTotal(data.total)
      })
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false))
  }, [page, typeFilter])

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Mis Pedidos</h1>
          <p className="text-[var(--color-muted)] text-sm mt-0.5">{total} transacción{total !== 1 ? 'es' : ''}</p>
        </div>
        <Link to="/dashboard" className="text-sm text-[var(--color-muted)] hover:text-white transition-colors">← Dashboard</Link>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {[['', 'Todos'], ['b2c', 'Tienda'], ['c2c_money', 'Dinero'], ['c2c_trade', 'Intercambio'], ['c2c_mixed', 'Mixto']].map(
          ([val, label]) => (
            <button key={val} onClick={() => { setTypeFilter(val); setPage(1) }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                typeFilter === val
                  ? 'bg-[var(--color-brand)] border-[var(--color-brand)] text-white'
                  : 'border-[var(--color-border)] text-[var(--color-muted)] hover:text-white'
              }`}>
              {label}
            </button>
          )
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-[var(--color-brand)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <p className="text-red-400 text-sm text-center py-12">{error}</p>
      ) : transactions.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🛒</p>
          <p className="text-[var(--color-muted)]">No tienes pedidos aún.</p>
          <Link to="/store" className="mt-4 inline-block text-sm text-[var(--color-brand)] hover:underline">Ir a la tienda →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => {
            const snap = tx.storeItemSnapshot
            const image = snap?.imageUrl
            const name = snap?.name ?? TYPE_LABEL[tx.type]
            const date = new Date(tx.createdAt).toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: 'numeric' })

            return (
              <Link
                key={tx._id}
                to={`/orders/${tx._id}`}
                className="rounded-xl bg-[var(--color-surface-1)] border border-[var(--color-border)] p-4 flex items-center gap-4 hover:border-[var(--color-brand)]/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-3)] flex items-center justify-center text-xl shrink-0 overflow-hidden">
                  {image
                    ? <img src={image} alt={name} className="w-full h-full object-cover" />
                    : (tx.type === 'b2c' ? '🏪' : tx.type === 'c2c_trade' ? '🔄' : '💸')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{name}</p>
                  <p className="text-[var(--color-muted)] text-xs mt-0.5">{date} · #{tx._id.slice(-8)}</p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  {tx.grossAmount ? (
                    <p className="text-white font-semibold text-sm">${(tx.grossAmount / 100).toFixed(2)}</p>
                  ) : <p className="text-[var(--color-muted)] text-sm">—</p>}
                  <StatusBadge status={tx.status} />
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-3 mt-6">
          <button onClick={() => setPage(p => Math.max(p-1,1))} disabled={page===1}
            className="px-4 py-2 text-sm rounded-lg border border-[var(--color-border)] text-[var(--color-muted)] hover:text-white disabled:opacity-40">← Anterior
          </button>
          <span className="text-[var(--color-muted)] text-sm self-center">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(p+1,totalPages))} disabled={page===totalPages}
            className="px-4 py-2 text-sm rounded-lg border border-[var(--color-border)] text-[var(--color-muted)] hover:text-white disabled:opacity-40">Siguiente →
          </button>
        </div>
      )}
    </div>
  )
}
