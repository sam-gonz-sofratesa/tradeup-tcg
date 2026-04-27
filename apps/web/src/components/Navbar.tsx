import { Link, NavLink } from 'react-router-dom'
import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/clerk-react'

export function Navbar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `hover:text-white transition-colors ${isActive ? 'text-white font-medium' : 'text-[var(--color-muted)]'}`

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-md">
      <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">🃏</span>
          <span className="font-display font-bold text-lg tracking-tight text-white">
            TradeUp
            <span className="text-[var(--color-brand-light)] ml-1 text-sm font-normal">TCG</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm">
          <NavLink to="/marketplace" className={linkClass}>Marketplace</NavLink>
          <NavLink to="/store" className={linkClass}>Tienda</NavLink>
          <SignedIn>
            <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
          </SignedIn>
        </div>

        <div className="flex items-center gap-3">
          <SignedIn>
            <Link
              to="/listings/new"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--color-brand)]/20 border border-[var(--color-brand)]/40 text-[var(--color-brand-light)] text-sm font-medium hover:bg-[var(--color-brand)]/30 transition-all"
            >
              + Publicar carta
            </Link>
            <UserButton appearance={{ elements: { avatarBox: 'w-8 h-8' } }} />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-sm px-4 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-muted)] hover:text-white hover:border-[var(--color-brand)] transition-all">
                Iniciar sesión
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </nav>
    </header>
  )
}
