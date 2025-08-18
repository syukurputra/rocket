'use client'

type FetchClientOpts = {
  /** redirect path saat 401; set false utk tidak redirect */
  redirectOn401?: string | false
}

export async function apiFetchClient<T>(
  input: string,
  init?: RequestInit,
  opts: FetchClientOpts = { redirectOn401: '/id/login' } // default redirect
): Promise<T> {
  const headers = new Headers(init?.headers)

  // Set JSON header jika body string belum punya CT
  if (init?.body && typeof init.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  // Inject Bearer token dari localStorage (kalau ada)
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(input, { ...init, headers, cache: init?.cache ?? 'no-store' })

  // Coba parse json sekali (aman walau gagal)
  let body: any = null
  try { body = await res.clone().json() } catch { /* ignore */ }

  if (!res.ok) {
    const msg = (body && body.message) ? body.message : `Request failed (${res.status})`

    // Khusus 401 → redirect
    if (res.status === 401 && opts.redirectOn401 !== false && typeof window !== 'undefined') {
      const target = typeof opts.redirectOn401 === 'string' ? opts.redirectOn401 : '/id/login'
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
