// src/libs/nomorTagihan.ts
//
// Nomor tagihan berformat TG-YYYYMM-00001, berurut per bulan.

import prisma from './prisma'

/**
 * Nomor tagihan berikutnya untuk bulan berjalan.
 *
 * Dipanggil berurutan (await satu per satu) kalau membuat beberapa tagihan
 * sekaligus, karena nomor diambil dari baris terakhir yang sudah tersimpan.
 */
export async function generateNomorTagihan(): Promise<string> {
  const now = new Date()
  const prefix = `TG-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-`

  const rows = await prisma.$queryRawUnsafe<{ nomorTagihan: string }[]>(
    `SELECT "nomorTagihan" FROM "tagihan" WHERE "nomorTagihan" LIKE $1 ORDER BY "nomorTagihan" DESC LIMIT 1`,
    `${prefix}%`
  )

  const lastNum = rows.length > 0 ? parseInt(rows[0].nomorTagihan.slice(-5)) : 0

  return `${prefix}${String(lastNum + 1).padStart(5, '0')}`
}
