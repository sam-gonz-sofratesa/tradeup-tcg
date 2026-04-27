import { createRootRoute, Outlet, ScrollRestoration } from '@tanstack/react-router'
import { ClerkProvider } from '@clerk/tanstack-start'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Navbar } from '../components/Navbar'
import '../styles/globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
})

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <ClerkProvider publishableKey={import.meta.env['VITE_CLERK_PUBLISHABLE_KEY']}>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen flex flex-col bg-[var(--color-surface)]">
          <Navbar />
          <main className="flex-1">
            <ScrollRestoration />
            <Outlet />
          </main>
          <footer className="border-t border-[var(--color-border)] py-8 mt-16">
            <div className="max-w-7xl mx-auto px-4 text-center text-[var(--color-muted)] text-sm">
              <p>© 2026 TradeUp TCG · El marketplace de cartas coleccionables</p>
            </div>
          </footer>
        </div>
      </QueryClientProvider>
    </ClerkProvider>
  )
}
