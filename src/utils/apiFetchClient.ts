// src/utils/apiFetchClient.ts
type FetchClientOpts = {
  /** redirect path saat 401; set false utk tidak redirect */
  redirectOn401?: string | false
  /** skip auto token refresh */
  skipTokenRefresh?: boolean
}

export async function apiFetchClient<T>(
  input: string,
  init?: RequestInit,
  opts: FetchClientOpts = { redirectOn401: '/id/login' }
): Promise<T> {
  const headers = new Headers(init?.headers)

  // Set JSON header jika body string belum punya CT
  if (init?.body && typeof init.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  // Inject Bearer token dari localStorage (kalau ada)
  let token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const makeRequest = async () => {
    return fetch(input, { ...init, headers, cache: init?.cache ?? 'no-store' })
  }

  let res = await makeRequest()

  // Coba parse json sekali (aman walau gagal)
  let body: any = null
  try {
    body = await res.clone().json()
  } catch { /* ignore */ }

  // Handle token expired (401) with automatic refresh
  if (res.status === 401 && !opts.skipTokenRefresh && typeof window !== 'undefined') {
    try {
      console.log('Token expired, attempting refresh...')

      // Try to refresh token
      const refreshSuccess = await refreshAccessToken()

      if (refreshSuccess) {
        console.log('Token refreshed successfully, retrying request...')

        // Update headers with new token
        const newToken = localStorage.getItem('accessToken')
        if (newToken) {
          headers.set('Authorization', `Bearer ${newToken}`)
        }

        // Retry the original request
        res = await makeRequest()

        // Re-parse body for the new response
        try {
          body = await res.clone().json()
        } catch { /* ignore */ }
      }
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError)
      // If refresh fails, proceed to redirect logic below
    }
  }

  if (!res.ok) {
    const msg = (body && body.message) ? body.message : `Request failed (${res.status})`

    // Khusus 401 → redirect (after refresh attempt)
    if (res.status === 401 && opts.redirectOn401 !== false && typeof window !== 'undefined') {
      const target = typeof opts.redirectOn401 === 'string' ? opts.redirectOn401 : '/id/login'

      console.log('Authentication failed, redirecting to login...')

      // Clear tokens before redirect
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')

      // pakai replace agar tidak menambah history stack
      window.location.replace(target)
      // hentikan eksekusi selanjutnya
      throw new Error(msg)
    }

    throw new Error(msg)
  }

  if (res.status === 204) return undefined as unknown as T
  return (body ?? (await res.json())) as T
}

// Function to refresh access token
async function refreshAccessToken(): Promise<boolean> {
  try {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error(`Refresh failed: ${response.status}`)
    }

    const data = await response.json()

    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken)

      // Update refresh token if provided
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken)
      }

      console.log('Tokens refreshed successfully')
      return true
    }

    return false
  } catch (error) {
    console.error('Token refresh error:', error)

    // Clear invalid tokens
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')

    return false
  }
}
