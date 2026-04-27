import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface)]">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-[var(--color-border)] py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center text-[var(--color-muted)] text-sm">
          <p>© 2026 TradeUp TCG · El marketplace de cartas coleccionables</p>
        </div>
      </footer>
    </div>
  )
}
