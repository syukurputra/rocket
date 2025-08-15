'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

interface ClientProtectionProps { children: React.ReactNode }

const protectedRoutes = [/^\/home(\/|$)/, /^\/about(\/|$)/, /^\/profile(\/|$)/, /^\/admin(\/|$)/]
const authRoutes = [/^\/login(\/|$)/, /^\/register(\/|$)/]

export default function ClientProtection({ children }: ClientProtectionProps) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      const res = await fetch('/api/auth/check', {
        credentials: 'include', // ⬅️ penting: kirim cookies httpOnly
        cache: 'no-store'
      })
      if (!res.ok) return null
      const data = await res.json().catch(() => null)
      return data?.user ?? null
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
        return
      }

      if (isAuth) {
        const user = await check()
        if (!cancelled && user) router.replace('/home')
      }
    }

    run()
    return () => { cancelled = true }
  }, [pathname, router])

  return <>{children}</>
}
