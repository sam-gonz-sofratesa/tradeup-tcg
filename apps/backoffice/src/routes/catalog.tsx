import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/catalog')({ component: CatalogPage })

function CatalogPage() {
  return <main><h1>Card Catalog & Requests</h1></main>
}
