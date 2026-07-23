// src/utils/apiFetchClient.ts
import { clearSession, ensureFreshToken, getAccessToken, markActivity, refreshSession } from './tokenStore'

type FetchClientOpts = {

  /** redirect path saat 401; set false utk tidak redirect */
  redirectOn401?: string | false

  /** skip auto token refresh */
  skipTokenRefresh?: boolean
}

export async function apiFetchClient<T>(
  input: string,
  init?: RequestInit,
  opts: FetchClientOpts = { redirectOn401: '/login' }
): Promise<T> {
  const headers = new Headers(init?.headers)

  // Set JSON header jika body string belum punya CT
  if (init?.body && typeof init.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  // Setiap panggilan API = tanda user masih aktif, jadi jendela idle digeser
  markActivity()

  // Perpanjang duluan kalau access token sudah mau habis, supaya tidak perlu
  // menunggu 401 dulu baru refresh
  const token = opts.skipTokenRefresh ? getAccessToken() : await ensureFreshToken()

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const makeRequest = async () => {
    return fetch(input, { ...init, headers, credentials: init?.credentials ?? 'include', cache: init?.cache ?? 'no-store' })
  }

  let res = await makeRequest()

  // Coba parse json sekali (aman walau gagal)
  let body: any = null

  try {
    body = await res.clone().json()
  } catch {
    /* ignore */
  }

  // Handle token expired (401) with automatic refresh
  if (res.status === 401 && !opts.skipTokenRefresh && typeof window !== 'undefined') {
    // refreshSession() single-flight: request paralel yang sama-sama kena 401
    // akan berbagi satu panggilan refresh
    const refreshed = await refreshSession()

    if (refreshed) {
      headers.set('Authorization', `Bearer ${refreshed.accessToken}`)

      // Retry the original request
      res = await makeRequest()

      // Re-parse body for the new response
      body = null

      try {
        body = await res.clone().json()
      } catch {
        /* ignore */
      }
    }
  }

  if (!res.ok) {
    const msg = body && body.message ? body.message : `Request failed (${res.status})`

    // Khusus 401 → redirect (after refresh attempt)
    if (res.status === 401 && opts.redirectOn401 !== false && typeof window !== 'undefined') {
      const target = typeof opts.redirectOn401 === 'string' ? opts.redirectOn401 : '/login'

      console.log('Authentication failed, redirecting to login...')

      // Clear tokens before redirect
      clearSession()

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
