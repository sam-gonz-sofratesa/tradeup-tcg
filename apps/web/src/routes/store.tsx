import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export const Route = createFileRoute('/store')({ component: StorePage })

function StorePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['store'],
    queryFn: () => api.store.list(),
  })

  const items: any[] = data?.items ?? []

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white mb-1">Tienda Oficial</h1>
        <p className="text-[var(--color-muted)] text-sm">
          Singles y sellados con garantía TradeUp
        </p>
      </div>

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
          <p className="text-[var(--color-muted)]">La tienda está siendo abastecida.</p>
          <p className="text-sm text-[var(--color-muted)]/60 mt-1">Vuelve pronto.</p>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item: any) => (
            <div
              key={item._id}
              className="rounded-[var(--radius-card)] bg-[var(--color-surface-2)] border border-[var(--color-border)] overflow-hidden card-glow"
            >
              <div className="aspect-[3/4] bg-[var(--color-surface-3)] relative">
                {item.photos?.[0] ? (
                  <img src={item.photos[0]} alt={item.catalogCard?.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl text-[var(--color-muted)]/20">🃏</div>
                )}
                {item.isGraded && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-xs font-bold bg-yellow-500/90 text-black">
                    {item.gradeCompany} {item.gradeValue}
                  </span>
                )}
                {item.isSealed && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-xs font-bold bg-blue-500/90 text-white">
                    Sellado
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-white truncate">{item.catalogCard?.name}</p>
                <p className="text-xs text-[var(--color-muted)] truncate mt-0.5">{item.catalogCard?.set}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-[var(--color-muted)]">{item.condition}</span>
                  <span className="text-sm font-bold text-[var(--color-brand-light)]">
                    ${(item.price / 100).toFixed(2)}
                  </span>
                </div>
                <button className="w-full mt-2 py-1.5 rounded-lg bg-[var(--color-brand)]/20 border border-[var(--color-brand)]/40 text-[var(--color-brand-light)] text-xs font-medium hover:bg-[var(--color-brand)]/30 transition-all">
                  Comprar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
