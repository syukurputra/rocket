'use client'
import { useEffect, useState, ReactNode } from 'react'
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

      const protectedRoutes = ['/home', '/dashboard', '/profile', '/admin']
      const authRoutes = ['/login', '/register']
      const publicRoutes = ['/about', '/contact', '/public']

      const isProtected = protectedRoutes.some(route => pathname.startsWith(route))
      const isAuth = authRoutes.some(route => pathname.startsWith(route))
      const isPublic = publicRoutes.some(route => pathname.startsWith(route))

      // Allow public routes immediately
      if (isPublic) {
        console.log('✅ Public route, allowing access')
        setIsAllowed(true)
        setIsChecking(false)
        return
      }

      const token = localStorage.getItem('accessToken')

      // Handle root path
      if (pathname === '/') {
        if (token) {
          window.location.href = '/home'
        } else {
          window.location.href = '/login'
        }
        return
      }

      // Handle protected routes
      if (isProtected) {
        if (!token) {
          console.log('❌ Protected route without token')
          window.location.href = '/login'
          return
        }

        // Verify token
        try {
          const response = await fetch('/api/auth/check', {
            headers: { 'Authorization': `Bearer ${token}` }
          })

          if (response.ok) {
            console.log('✅ Valid token, allowing access')
            setIsAllowed(true)
          } else {
            console.log('❌ Invalid token')
            localStorage.removeItem('accessToken')
            window.location.href = '/login'
            return
          }
        } catch (error) {
          console.log('⚠️ Token verification failed, allowing access (offline?)')
          setIsAllowed(true) // Allow access if verification fails (network issue)
        }
      }

      // Handle auth routes when logged in
      if (isAuth && token) {
        console.log('🔄 Already logged in, redirecting to home')
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
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
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
        <a href="/login" className="bg-blue-500 text-white px-4 py-2 rounded">
          Go to Login
        </a>
      </div>
    </div>
  )
}
