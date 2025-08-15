import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  username: string
  email: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const router = useRouter()

  // Check if user is authenticated
  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        // Try to refresh token
        await refreshToken()
      }
    } catch (error) {
      console.error('Auth check error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Refresh access token
  const refreshToken = async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setAccessToken(data.accessToken)
        localStorage.setItem('accessToken', data.accessToken)
        await checkAuth()
      } else {
        // Refresh failed, user needs to login again
        logout()
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      logout()
    }
  }

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
        setUser(data.user)
        router.push('/dashboard')
        return { success: true }
      } else {
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, message: 'Network error occurred' }
    }
  }

  // Logout function
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setAccessToken(null)
      localStorage.removeItem('accessToken')
      router.push('/login')
    }
  }

  useEffect(() => {
    // Get token from localStorage on mount
    const storedToken = localStorage.getItem('accessToken')
    if (storedToken) {
      setAccessToken(storedToken)
    }
  }, [])

  useEffect(() => {
    if (accessToken) {
      checkAuth()
    } else {
      setLoading(false)
    }
  }, [accessToken])

  return {
    user,
    loading,
    login,
    logout,
    refreshToken,
    isAuthenticated: !!user
  }
}
