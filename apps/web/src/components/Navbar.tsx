import { Link } from '@tanstack/react-router'
import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/tanstack-start'

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-md">
      <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">🃏</span>
          <span className="font-display font-bold text-lg tracking-tight text-white">
            TradeUp
            <span className="text-[var(--color-brand-light)] ml-1 text-sm font-normal">TCG</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6 text-sm text-[var(--color-muted)]">
          <Link
            to="/marketplace"
            className="hover:text-white transition-colors"
            activeProps={{ className: 'text-white font-medium' }}
          >
            Marketplace
          </Link>
          <Link
            to="/store"
            className="hover:text-white transition-colors"
            activeProps={{ className: 'text-white font-medium' }}
          >
            Tienda
          </Link>
          <SignedIn>
            <Link
              to="/dashboard"
              className="hover:text-white transition-colors"
              activeProps={{ className: 'text-white font-medium' }}
            >
              Dashboard
            </Link>
          </SignedIn>
        </div>

        {/* Auth */}
        <div className="flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-sm px-4 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-muted)] hover:text-white hover:border-[var(--color-brand)] transition-all">
                Iniciar sesión
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'w-8 h-8',
                },
              }}
            />
          </SignedIn>
        </div>
      </nav>
    </header>
  )
}
