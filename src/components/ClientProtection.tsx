'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

interface ClientProtectionProps {
  children: React.ReactNode
}

const protectedRoutes = [
  /^\/id\/home(\/|$)/,
  /^\/id\/aset\/list(\/|$)/,
  /^\/id\/aset\/view(\/|$)/,
  /^\/id\/keuangan\/list(\/|$)/,
  /^\/id\/penghuni\/list(\/|$)/,
  /^\/id\/master\/icon\/list(\/|$)/
]
const authRoutes = [/^\/id\/login(\/|$)/, /^\/id\/register(\/|$)/, /^\/id\/verifikasi(\/|$)/]

export default function ClientProtection({ children }: ClientProtectionProps) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      try {
        const res = await fetch('/api/auth/check', {
          credentials: 'include', // Important: send httpOnly cookies
          cache: 'no-store'
        })

        if (!res.ok) {
          // Clear all auth data on 401
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('user')
            localStorage.removeItem('userMenus')
          }
          return null
        }

        const data = await res.json().catch(() => null)
        return data?.user ?? null
      } catch (error) {
        console.error('Auth check failed:', error)
        return null
      }
    }

    const run = async () => {
      const isProtected = protectedRoutes.some(r => r.test(pathname))
      const isAuth = authRoutes.some(r => r.test(pathname))
      const isRoot = pathname === '/'

      if (isProtected || isRoot) {
        const user = await check()
        if (cancelled) return
        if (!user) {
          router.replace('/login')
        } else if (isRoot) {
          router.replace('/home')
        }

        if (isAuth) {
          const user = await check()
          if (!cancelled && user) router.replace('/home')
        }
        return
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [pathname, router])

  return <>{children}</>
}
