/**
 * Central registry untuk semua scheduled jobs
 *
 * Untuk menambahkan job baru:
 * 1. Buat file job baru di folder ini (contoh: myNewJob.ts)
 * 2. Export job dari file tersebut
 * 3. Import dan tambahkan ke array allJobs di bawah
 * 4. Set enabled: true untuk mengaktifkan job
 */

import type { ScheduledJob } from '../types/scheduler'
import { wilayahSyncJob } from './wilayahSyncJob'
import {
  cleanupTempFilesJob,
  databaseBackupJob,
  dailyReportJob,
  checkPaymentStatusJob,
  reminderNotificationJob
} from './exampleJobs'

/**
 * Daftar semua jobs yang tersedia
 * Tambahkan job baru di sini
 */
export const allJobs: ScheduledJob[] = [
  // Active jobs
  wilayahSyncJob,

  // Example jobs (disabled by default)
  cleanupTempFilesJob,
  databaseBackupJob,
  dailyReportJob,
  checkPaymentStatusJob,
  reminderNotificationJob
]

/**
 * Filter hanya job yang enabled
 */
export const enabledJobs = allJobs.filter(job => job.enabled !== false)
