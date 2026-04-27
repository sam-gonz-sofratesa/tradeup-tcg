import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage
})

function DashboardPage() {
  return (
    <main>
      {/* TODO: user listings, offers received/sent, history */}
      <h1>Dashboard</h1>
    </main>
  )
}
