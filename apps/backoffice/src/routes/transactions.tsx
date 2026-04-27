import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/transactions')({ component: TransactionsPage })

function TransactionsPage() {
  return <main><h1>Transaction History</h1></main>
}
