import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/offer')({
  component: MakeOfferPage
})

function MakeOfferPage() {
  return (
    <main>
      {/* TODO: offer flow — money / cards / mixed + Stripe checkout */}
      <h1>Make an Offer</h1>
    </main>
  )
}
