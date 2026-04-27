import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/listings/$id')({
  component: ListingDetailPage
})

function ListingDetailPage() {
  const { id } = Route.useParams()
  return (
    <main>
      {/* TODO: card photos, seller info, offer button */}
      <h1>Listing {id}</h1>
    </main>
  )
}
