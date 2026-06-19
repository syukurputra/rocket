import type { ScheduledJob } from '../types/scheduler'
import prisma from '../libs/prisma'

const FREE_PAKET_ID = 'paket-free-001'

/**
 * Job - Downgrade company yang paketnya sudah expired ke paket free
 * Berjalan setiap hari jam 01:00
 */
export const downgradeExpiredPaketJob: ScheduledJob = {
  name: 'downgrade-expired-paket',
  schedule: '0 1 * * *', // Setiap hari jam 01:00
  enabled: true,
  description: 'Downgrade company ke paket free jika paketEndDate sudah lewat',
  task: async () => {
    console.log('📦 [downgradeExpiredPaket] Memulai pengecekan paket yang expired...')

    const now = new Date()

    const expiredCompanies = await prisma.company.findMany({
      where: {
        paketEndDate: { lt: now },
        paketId: { not: FREE_PAKET_ID }
      },
      select: { id: true, nama: true, paketId: true, paketEndDate: true }
    })

    if (expiredCompanies.length === 0) {
      console.log('✅ [downgradeExpiredPaket] Tidak ada company yang perlu di-downgrade.')

      return
    }

    console.log(`⚠️ [downgradeExpiredPaket] Ditemukan ${expiredCompanies.length} company expired, memproses downgrade...`)

    const ids = expiredCompanies.map(c => c.id)

    await prisma.company.updateMany({
      where: { id: { in: ids } },
      data: {
        paketId: FREE_PAKET_ID,
        isTrial: false
      }
    })

    for (const c of expiredCompanies) {
      console.log(`  ✓ ${c.nama} (${c.id}) — expired: ${c.paketEndDate?.toISOString()}`)
    }

    console.log(`✅ [downgradeExpiredPaket] ${expiredCompanies.length} company berhasil di-downgrade ke paket free.`)
  }
}

/**
 * Contoh job sederhana - Cleanup temporary files
 * Berjalan setiap hari jam 3 pagi
 */
export const cleanupTempFilesJob: ScheduledJob = {
  name: 'cleanup-temp-files',
  schedule: '0 3 * * *', // Setiap hari jam 3 pagi
  task: async () => {
    console.log('🧹 Cleaning up temporary files...')

    // Implementasi cleanup di sini
    // Contoh: hapus file temporary, cache lama, dll
    console.log('✅ Temporary files cleaned')
  },
  enabled: false, // Disabled by default, aktifkan jika diperlukan
  description: 'Membersihkan file temporary dan cache lama'
}

/**
 * Contoh job - Database backup
 * Berjalan setiap hari jam 1 pagi
 */
export const databaseBackupJob: ScheduledJob = {
  name: 'database-backup',
  schedule: '0 1 * * *', // Setiap hari jam 1 pagi
  task: async () => {
    console.log('💾 Starting database backup...')

    // Implementasi backup database di sini
    console.log('✅ Database backup completed')
  },
  enabled: false, // Disabled by default
  description: 'Backup database harian'
}

/**
 * Contoh job - Send daily report
 * Berjalan setiap hari jam 8 pagi
 */
export const dailyReportJob: ScheduledJob = {
  name: 'daily-report',
  schedule: '0 8 * * *', // Setiap hari jam 8 pagi
  task: async () => {
    console.log('📊 Generating daily report...')

    // Implementasi generate dan kirim report di sini
    console.log('✅ Daily report sent')
  },
  enabled: false, // Disabled by default
  description: 'Mengirim laporan harian via email'
}

/**
 * Contoh job - Check payment status
 * Berjalan setiap jam
 */
export const checkPaymentStatusJob: ScheduledJob = {
  name: 'check-payment-status',
  schedule: '0 * * * *', // Setiap jam
  task: async () => {
    console.log('💳 Checking payment status...')

    // Implementasi cek status pembayaran di sini
    // Contoh: cek status dari payment gateway lain, update status invoice, dll
    console.log('✅ Payment status checked')
  },
  enabled: false, // Disabled by default
  description: 'Mengecek status pembayaran yang pending'
}

/**
 * Contoh job - Send reminder notifications
 * Berjalan setiap 30 menit
 */
export const reminderNotificationJob: ScheduledJob = {
  name: 'reminder-notification',
  schedule: '*/30 * * * *', // Setiap 30 menit
  task: async () => {
    console.log('🔔 Sending reminder notifications...')

    // Implementasi kirim notifikasi reminder di sini
    // Contoh: reminder pembayaran, reminder jatuh tempo, dll
    console.log('✅ Reminder notifications sent')
  },
  enabled: false, // Disabled by default
  description: 'Mengirim notifikasi reminder untuk pembayaran dan jatuh tempo'
}
