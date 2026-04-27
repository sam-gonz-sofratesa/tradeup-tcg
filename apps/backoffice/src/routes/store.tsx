import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/store')({ component: StoreManagePage })

function StoreManagePage() {
  return <main><h1>Store Management (B2C CRUD)</h1></main>
}
