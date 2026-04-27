import { useEffect, useRef } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { useApi } from '../lib/api'

/**
 * Llama POST /api/auth/sync una vez por sesion.
 * Se guarda en sessionStorage para no repetir en cada render.
 */
export function useAuthSync() {
  const { isSignedIn, isLoaded } = useAuth()
  const { user } = useUser()
  const apiFn = useApi()
  const synced = useRef(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return
    if (synced.current) return

    const key = `auth_synced_${user.id}`
    if (sessionStorage.getItem(key)) {
      synced.current = true
      return
    }

    apiFn.auth.sync()
      .then(() => {
        sessionStorage.setItem(key, '1')
        synced.current = true
      })
      .catch((err: any) => {
        // No bloquear la UI por esto, solo loguear
        console.warn('[auth-sync] failed:', err?.message)
      })
  }, [isLoaded, isSignedIn, user])
}
