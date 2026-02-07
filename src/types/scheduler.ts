import type { ScheduledTask } from 'node-cron'

/**
 * Interface untuk scheduled job
 */
export interface ScheduledJob {
  /**
   * Nama unik untuk job ini
   */
  name: string

  /**
   * Cron expression (contoh: '0 2 * * *' untuk setiap hari jam 2 pagi)
   * Format: second minute hour day month weekday
   *
   * Contoh:
   * - '0 * * * *' = Setiap jam
   * - '0 0 * * *' = Setiap hari jam 00:00
   * - '0 2 * * *' = Setiap hari jam 02:00
   * - '0 0 * * 0' = Setiap minggu hari Minggu jam 00:00
   * - '0 0 1 * *' = Setiap tanggal 1 jam 00:00
   */
  schedule: string

  /**
   * Fungsi yang akan dijalankan sesuai schedule
   */
  task: () => Promise<void>

  /**
   * Apakah job ini aktif? (default: true)
   */
  enabled?: boolean

  /**
   * Apakah job ini dijalankan saat startup? (default: false)
   * Hanya berlaku di development mode
   */
  runOnStartup?: boolean

  /**
   * Delay (ms) sebelum menjalankan job saat startup (default: 5000)
   */
  startupDelay?: number

  /**
   * Deskripsi job (opsional)
   */
  description?: string
}

/**
 * Interface untuk scheduler manager
 */
export interface SchedulerManager {
  /**
   * Mendaftarkan job baru
   */
  registerJob(job: ScheduledJob): void

  /**
   * Menghapus job berdasarkan nama
   */
  removeJob(name: string): boolean

  /**
   * Mendapatkan semua job yang terdaftar
   */
  getJobs(): Map<string, { job: ScheduledJob; task: ScheduledTask }>

  /**
   * Menjalankan semua job yang terdaftar
   */
  start(): void

  /**
   * Menghentikan semua job
   */
  stop(): void
}
