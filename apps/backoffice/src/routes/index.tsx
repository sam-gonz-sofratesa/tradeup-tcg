import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: AdminDashboard })

function AdminDashboard() {
  return (
    <main>
      {/* TODO: metrics — transactions, revenue, active users */}
      <h1>Admin Dashboard</h1>
    </main>
  )
}
