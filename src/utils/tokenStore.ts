// src/utils/tokenStore.ts
//
// Satu pintu untuk manajemen token di sisi client.
//
// Model sesi: sliding window.
// - Access token umurnya pendek (default 15 menit).
// - Refresh token adalah jendela idle (default 1 hari) dan dirotasi setiap kali
//   dipakai, jadi masa berlakunya ikut bergeser selama user masih mengakses
//   sistem. User baru dipaksa login ulang kalau benar-benar tidak ada akses
//   selama 1 hari penuh.

const ACCESS_KEY = 'accessToken'
const REFRESH_KEY = 'refreshToken'
const EXPIRES_KEY = 'accessTokenExpiresAt' // epoch ms
const LAST_ACTIVE_KEY = 'lastActiveAt' // epoch ms

/** Refresh dianggap perlu kalau sisa umur access token di bawah ambang ini. */
const REFRESH_SKEW_MS = 60 * 1000

export type RefreshResult = {
  accessToken: string
  expiresAt: number
}

const isBrowser = () => typeof window !== 'undefined'

export function getAccessToken(): string | null {
  if (!isBrowser()) return null

  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  if (!isBrowser()) return null

  return localStorage.getItem(REFRESH_KEY)
}

export function getAccessTokenExpiresAt(): number | null {
  if (!isBrowser()) return null

  const raw = localStorage.getItem(EXPIRES_KEY)
  const n = Number(raw)

  return Number.isFinite(n) && n > 0 ? n : null
}

export function markActivity() {
  if (!isBrowser()) return
  localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()))
}

export function getLastActiveAt(): number | null {
  if (!isBrowser()) return null

  const n = Number(localStorage.getItem(LAST_ACTIVE_KEY))

  return Number.isFinite(n) && n > 0 ? n : null
}

/** Simpan hasil login / refresh. `expiresIn` dalam detik. */
export function saveSession(data: {
  accessToken?: string
  refreshToken?: string
  expiresIn?: number
  menus?: unknown
}) {
  if (!isBrowser()) return

  if (data.accessToken) {
    localStorage.setItem(ACCESS_KEY, data.accessToken)

    const ttlSec = Number(data.expiresIn)
    const expiresAt = Number.isFinite(ttlSec) && ttlSec > 0 ? Date.now() + ttlSec * 1000 : readExpiryFromJwt(data.accessToken)

    if (expiresAt) localStorage.setItem(EXPIRES_KEY, String(expiresAt))
    else localStorage.removeItem(EXPIRES_KEY)
  }

  if (data.refreshToken) {
    localStorage.setItem(REFRESH_KEY, data.refreshToken)
  }

  if (data.menus && Array.isArray(data.menus)) {
    localStorage.setItem('userMenus', JSON.stringify(data.menus))
    window.dispatchEvent(new Event('userMenusUpdated'))
  }

  markActivity()
}

export function clearSession() {
  if (!isBrowser()) return
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(EXPIRES_KEY)
  localStorage.removeItem(LAST_ACTIVE_KEY)
  localStorage.removeItem('user')
  localStorage.removeItem('userMenus')
}

/** Baca klaim `exp` dari JWT tanpa verifikasi — hanya untuk penjadwalan di client. */
function readExpiryFromJwt(token: string): number | null {
  try {
    const part = token.split('.')[1]

    if (!part) return null

    const json = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')))

    return typeof json.exp === 'number' ? json.exp * 1000 : null
  } catch {
    return null
  }
}

/** True kalau access token tidak ada / sudah (hampir) kadaluarsa. */
export function needsRefresh(): boolean {
  if (!isBrowser()) return false
  if (!getAccessToken()) return true

  const expiresAt = getAccessTokenExpiresAt()

  // Tidak tahu kapan kadaluarsa → biarkan request jalan, 401 akan memicu refresh
  if (!expiresAt) return false

  return Date.now() >= expiresAt - REFRESH_SKEW_MS
}

// Single-flight: banyak request paralel yang sama-sama kena 401 hanya boleh
// memicu satu panggilan /api/auth/refresh. Tanpa ini, request kedua dst. akan
// memakai refresh token yang sudah dirotasi dan gagal.
let inFlight: Promise<RefreshResult | null> | null = null

export function refreshSession(): Promise<RefreshResult | null> {
  if (!isBrowser()) return Promise.resolve(null)

  if (!inFlight) {
    inFlight = doRefresh().finally(() => {
      inFlight = null
    })
  }

  return inFlight
}

async function doRefresh(): Promise<RefreshResult | null> {
  try {
    const refreshToken = getRefreshToken()

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },

      // kirim cookie httpOnly sebagai fallback kalau localStorage kosong
      credentials: 'include',
      body: JSON.stringify(refreshToken ? { refreshToken } : {}),
      cache: 'no-store'
    })

    if (!response.ok) {
      // 400/401 = refresh token benar-benar habis atau dicabut → sesi berakhir.
      // Error lain (5xx / jaringan) jangan sampai menghapus sesi yang masih sah.
      if (response.status === 400 || response.status === 401) {
        clearSession()
      }

      return null
    }

    const data = await response.json()

    if (!data?.accessToken) return null

    saveSession(data)

    return {
      accessToken: data.accessToken,
      expiresAt: getAccessTokenExpiresAt() ?? Date.now()
    }
  } catch (error) {
    // Kegagalan jaringan bukan alasan untuk logout
    console.error('Token refresh error:', error)

    return null
  }
}

/** Pastikan ada access token yang masih hidup sebelum request keluar. */
export async function ensureFreshToken(): Promise<string | null> {
  if (needsRefresh()) {
    await refreshSession()
  }

  return getAccessToken()
}
