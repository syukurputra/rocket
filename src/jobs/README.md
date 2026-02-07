# Cara Menambahkan Scheduled Job Baru

Panduan lengkap untuk menambahkan scheduled job baru ke aplikasi.

## Langkah 1: Buat File Job Baru

Buat file baru di folder `src/jobs/`, contoh: `myCustomJob.ts`

```typescript
import type { ScheduledJob } from '../types/scheduler'

/**
 * Deskripsi job Anda
 */
export const myCustomJob: ScheduledJob = {
  name: 'my-custom-job',
  schedule: '0 9 * * *', // Setiap hari jam 9 pagi
  task: async () => {
    console.log('🚀 Running my custom job...')

    // Implementasi logic Anda di sini
    // Contoh: kirim email, update database, dll

    console.log('✅ My custom job completed')
  },
  enabled: true, // Set true untuk mengaktifkan
  runOnStartup: false, // Set true jika ingin run saat startup (dev mode)
  startupDelay: 5000, // Delay dalam ms (default: 5000)
  description: 'Deskripsi singkat job Anda'
}
```

## Langkah 2: Daftarkan Job ke Registry

Edit file `src/jobs/index.ts` dan tambahkan job Anda:

```typescript
import { myCustomJob } from './myCustomJob'

export const allJobs: ScheduledJob[] = [
  wilayahSyncJob,
  myCustomJob // Tambahkan di sini
  // ... job lainnya
]
```

## Langkah 3: Restart Aplikasi

Job akan otomatis terdaftar saat aplikasi restart. Anda akan melihat log:

```
📋 Registering scheduled jobs...

📝 Registered job: my-custom-job (0 9 * * *) - Deskripsi singkat job Anda

🎯 Starting scheduler with X job(s)...
▶️  Started: my-custom-job - Schedule: 0 9 * * *
```

## Cron Expression Reference

Format: `minute hour day month weekday`

| Expression     | Deskripsi                   |
| -------------- | --------------------------- |
| `* * * * *`    | Setiap menit                |
| `0 * * * *`    | Setiap jam                  |
| `0 0 * * *`    | Setiap hari jam 00:00       |
| `0 2 * * *`    | Setiap hari jam 02:00       |
| `0 9 * * *`    | Setiap hari jam 09:00       |
| `0 0 * * 0`    | Setiap Minggu jam 00:00     |
| `0 0 1 * *`    | Setiap tanggal 1 jam 00:00  |
| `*/30 * * * *` | Setiap 30 menit             |
| `0 */6 * * *`  | Setiap 6 jam                |
| `0 9-17 * * *` | Setiap jam dari 09:00-17:00 |
| `0 9 * * 1-5`  | Setiap hari kerja jam 09:00 |

## Contoh Job Lengkap

### Kirim Email Report Harian

```typescript
import type { ScheduledJob } from '../types/scheduler'
import { sendEmail } from '../libs/email'

export const dailyReportEmailJob: ScheduledJob = {
  name: 'daily-report-email',
  schedule: '0 8 * * *', // Jam 8 pagi setiap hari
  task: async () => {
    console.log('📧 Sending daily report email...')

    // Generate report data
    const reportData = await generateDailyReport()

    // Send email
    await sendEmail({
      to: 'admin@example.com',
      subject: 'Daily Report',
      html: reportData
    })

    console.log('✅ Daily report email sent')
  },
  enabled: true,
  description: 'Kirim laporan harian via email'
}
```

### Cleanup Old Data

```typescript
import type { ScheduledJob } from '../types/scheduler'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const cleanupOldDataJob: ScheduledJob = {
  name: 'cleanup-old-data',
  schedule: '0 3 * * 0', // Setiap Minggu jam 3 pagi
  task: async () => {
    console.log('🧹 Cleaning up old data...')

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Hapus data lama
    const result = await prisma.logs.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo
        }
      }
    })

    console.log(`✅ Deleted ${result.count} old records`)
  },
  enabled: true,
  description: 'Hapus data log yang lebih dari 30 hari'
}
```

## Tips

1. **Testing**: Set `runOnStartup: true` saat development untuk test job Anda
2. **Error Handling**: Selalu gunakan try-catch di dalam task function
3. **Logging**: Gunakan console.log untuk tracking progress
4. **Performance**: Untuk job yang berat, pertimbangkan untuk run di off-peak hours
5. **Disable**: Set `enabled: false` untuk temporary disable job tanpa hapus code
