'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

interface ClientProtectionProps { children: React.ReactNode }

const protectedRoutes = [
  /^\/id\/home(\/|$)/,
  /^\/id\/aset\/list(\/|$)/,
  /^\/id\/aset\/view(\/|$)/,
  /^\/id\/keuangan\/list(\/|$)/]
const authRoutes = [/^\/id\/login(\/|$)/, /^\/id\/register(\/|$)/]

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
      const isRoot = pathname === '/id/'

      if (isProtected || isRoot) {
        const user = await check()
        if (cancelled) return
        if (!user) {
          router.replace('/id/login')
        } else if (isRoot) {
          router.replace('/id/home')
        }

        if (isAuth) {
          const user = await check()
          if (!cancelled && user) router.replace('/id/home')
        }
        return
      }
    }

    run()
    return () => { cancelled = true }
  }, [pathname, router])

  return <>{children}</>
}
