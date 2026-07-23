'use client'

import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'

import { useRouter, usePathname } from 'next/navigation'

import {
  clearSession,
  getAccessToken,
  getAccessTokenExpiresAt,
  markActivity,
  refreshSession,
  saveSession
} from '@/src/utils/tokenStore'

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
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setAccessToken(null)
      clearSession()
      router.push('/login')
    }
  }, [router])

  // Refresh access token (rotasi + perpanjang jendela idle)
  const refreshToken = useCallback(async () => {
    const result = await refreshSession()

    if (result) {
      setAccessToken(result.accessToken)

      // checkAuth akan terpicu oleh useEffect saat accessToken berubah
      return
    }

    // Refresh gagal → refresh token benar-benar habis / dicabut
    logout()
  }, [logout])

  // Check if user is authenticated
  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        credentials: 'include',
        cache: 'no-store'
      })

      if (response.ok) {
        const data = await response.json()

        setUser(data.user)
        markActivity()

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
        // simpan accessToken + refreshToken + waktu kadaluarsa + menus
        saveSession(data)
        setAccessToken(data.accessToken)

        setUser(data.user)

        // Store user data including role
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user))
        }

        // Redirect ke returnTo jika ada pendingChat / pendingBooking, otherwise /home
        try {
          const rawChat = localStorage.getItem('pendingChat')
          const rawBooking = localStorage.getItem('pendingBooking')

          const returnTo = rawChat
            ? JSON.parse(rawChat).returnTo
            : rawBooking
              ? JSON.parse(rawBooking).returnTo
              : null

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

    const isPublicRoute = pathname === '/' || publicRoutes.some(route => pathname.startsWith(route))

    // Skip auth initialization for public routes
    if (isPublicRoute) {
      setLoading(false)

      return
    }

    // Get token from localStorage on mount
    const storedToken = getAccessToken()

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

    const isPublicRoute = pathname === '/' || publicRoutes.some(route => pathname.startsWith(route))

    // Skip auth check for public routes
    if (isPublicRoute) {
      return
    }

    if (accessToken) {
      checkAuth()
    }
  }, [accessToken, checkAuth, pathname])

  // Perpanjang access token sebelum kadaluarsa, selama tab masih dibuka.
  // Tanpa ini user hanya bertahan selama umur access token walaupun refresh
  // token-nya masih berlaku.
  useEffect(() => {
    if (!accessToken) return

    const expiresAt = getAccessTokenExpiresAt()

    if (!expiresAt) return

    // refresh 1 menit sebelum kadaluarsa, minimal 5 detik dari sekarang
    const delay = Math.max(expiresAt - Date.now() - 60 * 1000, 5000)

    const timer = setTimeout(() => {
      refreshSession().then(result => {
        if (result) setAccessToken(result.accessToken)
      })
    }, delay)

    return () => clearTimeout(timer)
  }, [accessToken])

  // Tab yang lama tidak aktif (atau laptop yang di-sleep) melewatkan timer di
  // atas — perpanjang lagi begitu user kembali, selagi jendela idle belum habis.
  useEffect(() => {
    if (typeof document === 'undefined') return

    const onVisible = async () => {
      if (document.visibilityState !== 'visible') return

      markActivity()

      const expiresAt = getAccessTokenExpiresAt()

      if (!getAccessToken() || !expiresAt) return

      if (Date.now() >= expiresAt - 60 * 1000) {
        const result = await refreshSession()

        if (result) setAccessToken(result.accessToken)
      }
    }

    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [])

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
