import prisma from './prisma'

// Kategori keuangan bawaan sistem untuk pemasukan dari booking — PER COMPANY.
// id dibuat deterministik per company (bukan cuid acak) supaya gampang dicari/
// dipakai ulang tanpa perlu findFirst scan, dan tetap unik antar company.
const bookingCategoryId = (companyId: string) => `BOOKING-${companyId}`
const BOOKING_ICON_CODE = 'tabler-cash-banknote'

type TagihanForKeuangan = {
  id: string
  keterangan: string
  nominal: any
  companyId: string
  createdById: string
  asetId: string | null
  aset?: { nama: string } | null
  ruangan?: { nama: string } | null
}

/**
 * Pastikan kategori keuangan "Booking" (tipe Pemasukan) milik company ini tersedia,
 * buat kalau belum ada. Termasuk memastikan MasterIcon dengan code yang diminta
 * tersedia (icon global, dipakai bersama lintas company) untuk dipakai sebagai iconId.
 */
async function ensureBookingCategory(companyId: string, createdById: string) {
  const categoryId = bookingCategoryId(companyId)

  const existing = await prisma.categoryKeuangan.findUnique({ where: { id: categoryId } })

  if (existing) return existing

  let icon = await prisma.masterIcon.findFirst({ where: { code: BOOKING_ICON_CODE } })

  if (!icon) {
    icon = await prisma.masterIcon.create({
      data: {
        nama: 'Cash Banknote',
        code: BOOKING_ICON_CODE,
        keyword: 'uang, tunai, kas, duit, lembaran, pendapatan',
        createdById,
        updatedById: createdById
      }
    })
  }

  // Race guard: kalau ada request lain (company sama) yang barusan membuat
  // kategori ini duluan, pakai punya mereka (id deterministik → create gagal
  // karena unique constraint, bukan error yang perlu dilempar ke caller).
  try {
    return await prisma.categoryKeuangan.create({
      data: {
        id: categoryId,
        nama: 'Booking',
        jenis: 'Pemasukan',
        deskripsi: 'Pemasukan otomatis dari pembayaran booking',
        status: true,
        companyId,
        createdById,
        updatedById: createdById,
        iconId: icon.id
      }
    })
  } catch {
    const fallback = await prisma.categoryKeuangan.findUnique({ where: { id: categoryId } })

    if (fallback) return fallback
    throw new Error(`Gagal memastikan kategori keuangan Booking untuk company ${companyId}`)
  }
}

/**
 * Catat pemasukan keuangan ketika tagihan booking berhasil dibayar.
 * Panggil hanya sekali per tagihan — caller bertanggung jawab atas idempotensi
 * (lihat pemakaian di ipaymu/notify: digerbang oleh hasil createPendapatan).
 */
export async function createKeuanganBooking(tagihan: TagihanForKeuangan): Promise<void> {
  if (!tagihan.asetId) {
    console.warn(`[KeuanganBooking] Tagihan "${tagihan.id}" tidak punya asetId, lewati insert keuangan`)

    return
  }

  const category = await ensureBookingCategory(tagihan.companyId, tagihan.createdById)

  const namaAset = tagihan.aset?.nama || '-'
  const namaItemAset = tagihan.ruangan?.nama || '-'
  const keterangan = `Booking ${namaAset} - ${namaItemAset} - ${tagihan.keterangan}`

  await prisma.keuangan.create({
    data: {
      jenis: 'pemasukan',
      keterangan,
      nominal: Number(tagihan.nominal),
      tanggal: new Date(),
      asetId: tagihan.asetId,
      categoryKeuanganId: category.id,
      companyId: tagihan.companyId,
      createdById: tagihan.createdById,
      updatedById: tagihan.createdById
    }
  })

  console.log(`[KeuanganBooking] Recorded: tagihanId=${tagihan.id} kategori=${category.id}`)
}
