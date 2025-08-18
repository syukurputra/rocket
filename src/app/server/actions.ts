'use server'

import { headers, cookies } from 'next/headers'

type GetAsetParams = {
  page?: number
  limit?: number
  search?: string
  jenis?: string
  kota?: string
  provinsi?: string
  status?: boolean | '' // '' = tanpa filter
}

export async function getAsetData(params: GetAsetParams = {}) {
  const {
    page = 1,
    limit = 10,
    search = '',
    jenis = '',
    kota = '',
    provinsi = '',
    status = ''
  } = params

  const h = await headers()
  const proto = h.get('x-forwarded-proto') ?? 'http'
  const host = h.get('x-forwarded-host') ?? h.get('host')!
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `${proto}://${host}`

  // Query string
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit)
  })
  if (search) qs.set('search', search)
  if (jenis) qs.set('jenis', jenis)
  if (kota) qs.set('kota', kota)
  if (provinsi) qs.set('provinsi', provinsi)
  if (status !== '') qs.set('status', String(Boolean(status))) // 'true'/'false'

  // Token dari cookie (samakan nama cookie kamu)
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value

  const res = await fetch(`${baseUrl}/api/aset?${qs.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store' // biar selalu fresh
  })

  if (!res.ok) {
    if (res.status === 401) return []
    throw new Error(`Aset API error: ${res.status}`)
  }

  const json = await res.json()
  return json.data as any[] // atau AsetType[] jika punya tipenya
}
