import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/marketplace')({
  component: MarketplacePage
})

function MarketplacePage() {
  return (
    <main>
      {/* TODO: filters, listing grid */}
      <h1>Marketplace</h1>
    </main>
  )
}
