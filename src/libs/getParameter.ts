import prisma from './prisma'

const _cache: Map<string, string> = new Map()

/**
 * Ambil value dari tabel m_parameter berdasarkan id.
 * Result di-cache per id agar tidak query DB setiap request.
 * Panggil clearParameterCache() untuk invalidasi jika data berubah.
 */
export async function getParameter(id: string, fallback = ''): Promise<string> {
  if (_cache.has(id)) return _cache.get(id)!

  try {
    const rows = await prisma.$queryRaw<{ value: string }[]>`
      SELECT value FROM "m_parameter" WHERE id = ${id} LIMIT 1
    `
    const value = rows[0]?.value ?? fallback

    _cache.set(id, value)

    return value
  } catch {
    return fallback
  }
}

export function clearParameterCache(id?: string) {
  if (id) _cache.delete(id)
  else _cache.clear()
}
