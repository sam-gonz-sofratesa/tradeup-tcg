import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ 
  component: HomePage 
})

function HomePage() {
  return (
    <main>
      {/* TODO: Landing — hero, featured cards, CTA */}
      <h1>TradeUp — Home</h1>
    </main>
  )
}
