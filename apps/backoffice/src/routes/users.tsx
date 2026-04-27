import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/users')({ component: UsersPage })

function UsersPage() {
  return <main><h1>User Management</h1></main>
}
