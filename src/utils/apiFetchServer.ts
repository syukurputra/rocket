'use server'

import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'

class HttpError extends Error {
  constructor(public status: number, public body?: any, message?: string) {
    super(message)
  }
}

export async function apiFetchServer<T>(url: string, init?: RequestInit, opts?: { redirectOn401?: string | false }): Promise<T> {

  const h = await headers()
  const proto = h.get('x-forwarded-proto') ?? 'http'
  const host = h.get('x-forwarded-host') ?? h.get('host')!
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `${proto}://${host}`

  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value

  const path = url.startsWith('/') ? url : `/${url}`
  const absolute = `${baseUrl}${path}`

  const res = await fetch(absolute, {...init,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  })

  if (!res.ok) {
    let body: any = null
    let message = `Request failed (${res.status})`
    try {
      body = await res.clone().json()
      if (body?.message) message = body.message
    } catch {
      try {
        const text = await res.clone().text()
        if (text) {
          body = text
          message = typeof body === 'string' ? body : message
        }
      } catch { /* ignore */ }
    }

    if (res.status === 401) {
      if (opts?.redirectOn401) {
        redirect(typeof opts.redirectOn401 === 'string' ? opts.redirectOn401 : '/login')
      }
    }

    throw new HttpError(res.status, body, message)
  }

  // --- No Content ---
  if (res.status === 204) return undefined as unknown as T

  return res.json() as Promise<T>
}
