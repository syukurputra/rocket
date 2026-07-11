'use client'

import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'

import { useRouter, usePathname } from 'next/navigation'

interface User {
  id: string
  username: string
  email: string
  company?: {
    id: string
    nama: string
    paketId: string | null
    isTrial: boolean
  } | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Logout function
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setAccessToken(null)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('userMenus')
      router.push('/login')
    }
  }, [router])

  // Refresh access token
  const refreshToken = useCallback(async () => {
    try {
      const storedRefreshToken = localStorage.getItem('refreshToken')

      if (!storedRefreshToken) {
        console.error('No refresh token available')
        logout()

        return
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: storedRefreshToken })
      })

      if (response.ok) {
        const data = await response.json()

        setAccessToken(data.accessToken)
        localStorage.setItem('accessToken', data.accessToken)

        // Update refresh token if provided
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken)
        }

        // Update user menus if provided
        if (data.menus && Array.isArray(data.menus)) {
          localStorage.setItem('userMenus', JSON.stringify(data.menus))
          window.dispatchEvent(new Event('userMenusUpdated'))
        }

        // checkAuth will be triggered by useEffect when accessToken changes
      } else {
        // Refresh failed, user needs to login again
        logout()
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      logout()
    }
  }, [logout])

  // Check if user is authenticated
  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      if (response.ok) {
        const data = await response.json()

        setUser(data.user)

        // Store user menus and notify listeners
        if (data.menus && Array.isArray(data.menus)) {
          localStorage.setItem('userMenus', JSON.stringify(data.menus))
          window.dispatchEvent(new Event('userMenusUpdated'))
        }
      } else {
        // Try to refresh token
        await refreshToken()
      }
    } catch (error) {
      console.error('Auth check error:', error)
    } finally {
      setLoading(false)
    }
  }, [accessToken, refreshToken])

  // Login function
  const login = async (username: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (response.ok) {
        setAccessToken(data.accessToken)
        localStorage.setItem('accessToken', data.accessToken)

        // Store refresh token
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken)
        }

        setUser(data.user)

        // Store user data including role
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user))
        }

        // Store user menus
        if (data.menus && Array.isArray(data.menus)) {
          localStorage.setItem('userMenus', JSON.stringify(data.menus))
          window.dispatchEvent(new Event('userMenusUpdated'))
        }

        // Redirect ke publish page (returnTo) jika ada pendingBooking, otherwise /home
        try {
          const raw = localStorage.getItem('pendingBooking')
          const returnTo = raw ? JSON.parse(raw).returnTo : null

          router.push(returnTo || '/home')
        } catch {
          router.push('/home')
        }

        return { success: true }
      } else {
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Login error:', error)

      return { success: false, message: 'Network error occurred' }
    }
  }

  useEffect(() => {
    // Define public routes that don't need authentication
    const publicRoutes = [
      '/landing',
      '/about',
      '/contact',
      '/public',
      '/login',
      '/register',
      '/invitation',
      '/forgot-password',
      '/reset-password',
      '/auth-success',
      '/publish',
      '/home'
    ]

    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

    // Skip auth initialization for public routes
    if (isPublicRoute) {
      setLoading(false)

      return
    }

    // Get token from localStorage on mount
    const storedToken = localStorage.getItem('accessToken')

    if (storedToken) {
      setAccessToken(storedToken)
    } else {
      // If no token, still try to check auth (cookies might be present)
      checkAuth()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    // Define public routes
    const publicRoutes = [
      '/landing',
      '/about',
      '/contact',
      '/public',
      '/login',
      '/register',
      '/invitation',
      '/forgot-password',
      '/reset-password',
      '/auth-success',
      '/publish',
      '/home'
    ]

    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

    // Skip auth check for public routes
    if (isPublicRoute) {
      return
    }

    if (accessToken) {
      checkAuth()
    }
  }, [accessToken, checkAuth, pathname])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshToken, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
