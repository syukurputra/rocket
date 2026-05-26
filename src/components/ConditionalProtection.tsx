'use client'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

import { usePathname } from 'next/navigation'

interface ConditionalProtectionProps {
  children: ReactNode
}

export default function ConditionalProtection({ children }: ConditionalProtectionProps) {
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)
  const [isAllowed, setIsAllowed] = useState(false)

  useEffect(() => {
    const checkAccess = async () => {
      console.log('🔍 Checking access for:', pathname)

      const protectedRoutes = ['/home', '/dashboard', '/aset', '/keuangan', '/penyewa']
      const authRoutes = ['/login']

      const publicRoutes = [
        '/about',
        '/contact',
        '/public',
        '/landing',
        '/invitation',
        '/register',
        '/forgot-password',
        '/reset-password'
      ]

      const isProtected = protectedRoutes.some(route => pathname.startsWith(route))
      const isAuth = authRoutes.some(route => pathname.startsWith(route))
      const isPublic = publicRoutes.some(route => pathname.startsWith(route))

      // Allow public routes immediately
      if (isPublic) {
        setIsAllowed(true)
        setIsChecking(false)

        return
      }

      const token = localStorage.getItem('accessToken')

      // Handle root path - always redirect to landing
      if (pathname === '/') {
        window.location.href = '/landing'

        return
      }

      // Handle protected routes
      if (isProtected) {
        if (!token) {
          window.location.href = '/login'

          return
        }

        // Verify token
        try {
          const response = await fetch('/api/auth/check', {
            headers: { Authorization: `Bearer ${token}` },
            credentials: 'include'
          })

          if (response.ok) {
            setIsAllowed(true)
          } else {
            // Clear all auth data immediately
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('user')
            localStorage.removeItem('userMenus')

            // Redirect to login
            window.location.href = '/login'

            return
          }
        } catch (error) {
          console.error('Auth check error:', error)

          // On network error, clear tokens and redirect
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          localStorage.removeItem('userMenus')
          window.location.href = '/login'

          return
        }
      }

      // Handle auth routes when logged in
      if (isAuth && token) {
        window.location.href = '/home'

        return
      }

      // Default allow for auth routes and other routes
      if (isAuth || !isProtected) {
        setIsAllowed(true)
      }

      setIsChecking(false)
    }

    checkAccess()
  }, [pathname])

  // Show loading while checking
  if (isChecking) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Show content if allowed
  if (isAllowed) {
    return <>{children}</>
  }

  // Fallback (shouldn't reach here due to redirects)
  return (
    <div className='min-h-screen flex items-center justify-center'>
      <div className='text-center'>
        <h1 className='text-2xl font-bold text-red-600 mb-4'>Access Denied</h1>
        <p className='text-gray-600 mb-4'>You don't have permission to access this page.</p>
        <a href='/login' className='bg-blue-500 text-white px-4 py-2 rounded'>
          Go to Login
        </a>
      </div>
    </div>
  )
}
