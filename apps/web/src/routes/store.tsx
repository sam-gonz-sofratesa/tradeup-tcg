import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/store')({
  component: StorePage
})

function StorePage() {
  return (
    <main>
      {/* TODO: TradeUp B2C store — graded & sealed items */}
      <h1>Official Store</h1>
    </main>
  )
}
