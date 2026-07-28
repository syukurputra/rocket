import prisma from './prisma'

// Persentase biaya layanan platform (0 = tidak ada potongan saat ini)
const BIAYA_LAYANAN_RATE = 0

/**
 * Catat pendapatan company ketika tagihan booking berhasil LUNAS.
 * Idempotent: aman dipanggil berkali-kali karena `tagihanId` adalah unique.
 *
 * @returns true jika record baru dibuat (baru pertama kali diproses),
 *          false jika sudah ada sebelumnya (dilewati). Dipakai sebagai sinyal
 *          idempotensi untuk side-effect lain (mis. insert Keuangan) yang
 *          tidak punya unique constraint sendiri terhadap tagihanId.
 */
export async function createPendapatan(tagihanId: string, companyId: string, nominal: number): Promise<boolean> {
  const existing = await (prisma as any).pendapatan.findUnique({ where: { tagihanId } })

  if (existing) return false

  const biayaBooking = nominal
  const biayaLayanan = Math.round(biayaBooking * BIAYA_LAYANAN_RATE)
  const saldoCompany = biayaBooking - biayaLayanan

  await (prisma as any).pendapatan.create({
    data: {
      tagihanId,
      companyId,
      biayaBooking,
      biayaLayanan,
      saldoCompany,
      tanggal: new Date()
    }
  })

  console.log(`[Pendapatan] Recorded: tagihanId=${tagihanId} biaya=${biayaBooking} saldo=${saldoCompany}`)

  return true
}
