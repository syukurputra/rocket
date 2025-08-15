'use client'
import { useEffect, ReactNode } from 'react'
import { usePathname } from 'next/navigation'

interface ClientProtectionProps {
  children: ReactNode
}

export default function ClientProtection({ children }: ClientProtectionProps) {
  const pathname = usePathname()

  useEffect(() => {
    console.log('🛡️ CLIENT PROTECTION CHECK:', pathname)

    // Protected routes
    const protectedRoutes = ['/home', '/about', '/profile', '/admin']
    const authRoutes = ['/login', '/register']

    // Check if current route is protected
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

    console.log('🔒 Is protected route:', isProtectedRoute)

    if (isProtectedRoute) {
      const token = localStorage.getItem('accessToken')
      console.log('🔑 Token found:', token ? 'YES' : 'NO')

      if (!token) {
        console.log('❌ No token, redirecting to login')
        window.location.href = '/login'
        return
      }

      // Optional: Verify token with API
      fetch('/api/auth/check', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(response => {
          if (!response.ok) {
            console.log('❌ Invalid token, redirecting to login')
            localStorage.removeItem('accessToken')
            window.location.href = '/login'
          } else {
            console.log('✅ Token valid, allowing access')
          }
        })
        .catch(error => {
          console.error('Token verification error:', error)
          // Don't redirect on network error, just log
        })
    }

    // If already logged in and accessing auth routes
    if (isAuthRoute) {
      const token = localStorage.getItem('accessToken')
      if (token) {
        console.log('🔄 Already logged in, redirecting to home')
        window.location.href = '/home'
      }
    }

    // Handle root path
    if (pathname === '/') {
      const token = localStorage.getItem('accessToken')
      if (token) {
        console.log('🏠 Root access with token, redirecting to home')
        window.location.href = '/home'
      } else {
        console.log('🚪 Root access without token, redirecting to login')
        window.location.href = '/login'
      }
    }

  }, [pathname])

  return <>{children}</>
}
