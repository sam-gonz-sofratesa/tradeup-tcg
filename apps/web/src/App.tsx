import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { Layout } from './components/Layout'
import { LandingPage } from './pages/LandingPage'
import { MarketplacePage } from './pages/MarketplacePage'
import { ListingDetailPage } from './pages/ListingDetailPage'
import { StorePage } from './pages/StorePage'
import { DashboardPage } from './pages/DashboardPage'
import { CreateListingPage } from './pages/CreateListingPage'
import { UserProfilePage } from './pages/UserProfilePage'
import { OrdersPage } from './pages/OrdersPage'
import { useAuthSync } from './hooks/useAuthSync'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth()
  if (!isLoaded) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-[var(--color-brand)] border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!isSignedIn) return <Navigate to="/" replace />
  return <>{children}</>
}

function AppRoutes() {
  useAuthSync()

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/listings/:id" element={<ListingDetailPage />} />
        <Route path="/store" element={<StorePage />} />
        <Route path="/users/:id" element={<UserProfilePage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/listings/new"
          element={
            <ProtectedRoute>
              <CreateListingPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return <AppRoutes />
}
