import cron from 'node-cron'
import type { ScheduledTask } from 'node-cron'

import type { ScheduledJob, SchedulerManager } from '../types/scheduler'

/**
 * General Scheduler Manager
 * Mengelola semua scheduled jobs dalam aplikasi
 */
class Scheduler implements SchedulerManager {
  private jobs: Map<string, { job: ScheduledJob; task: ScheduledTask }> = new Map()

  private isStarted = false

  /**
   * Mendaftarkan job baru ke scheduler
   */
  registerJob(job: ScheduledJob): void {
    // Validasi cron expression
    if (!cron.validate(job.schedule)) {
      console.error(`❌ Invalid cron expression for job "${job.name}": ${job.schedule}`)

      return
    }

    // Cek apakah job sudah terdaftar
    if (this.jobs.has(job.name)) {
      console.warn(`⚠️  Job "${job.name}" already registered. Skipping.`)

      return
    }

    // Set default values
    const enabled = job.enabled !== false
    const runOnStartup = job.runOnStartup || false
    const startupDelay = job.startupDelay || 5000

    if (!enabled) {
      console.log(`⏸️  Job "${job.name}" is disabled. Skipping registration.`)

      return
    }

    // Buat scheduled task dengan logging
    const scheduledTask = cron.schedule(job.schedule, async () => {
      const startTime = Date.now()
      let logId: string | null = null

      console.log(`⏰ Running scheduled job: ${job.name}`)

      try {
        // Create log entry - started
        const { PrismaClient } = await import('@prisma/client')
        const prisma = new PrismaClient()

        const log = await prisma.schedulerLog.create({
          data: {
            jobName: job.name,
            status: 'started',
            startedAt: new Date()
          }
        })

        logId = log.id

        // Execute job
        await job.task()

        const duration = Date.now() - startTime

        // Update log - success
        await prisma.schedulerLog.update({
          where: { id: logId },
          data: {
            status: 'success',
            completedAt: new Date(),
            duration
          }
        })

        await prisma.$disconnect()

        console.log(`✅ Job "${job.name}" completed successfully (${duration}ms)`)
      } catch (error) {
        const duration = Date.now() - startTime

        console.error(`❌ Job "${job.name}" failed:`, error)

        // Update log - failed
        try {
          const { PrismaClient } = await import('@prisma/client')
          const prisma = new PrismaClient()

          if (logId) {
            await prisma.schedulerLog.update({
              where: { id: logId },
              data: {
                status: 'failed',
                completedAt: new Date(),
                duration,
                errorMessage: error instanceof Error ? error.message : String(error),
                errorStack: error instanceof Error ? error.stack : undefined
              }
            })
          }

          await prisma.$disconnect()
        } catch (logError) {
          console.error('Failed to log error:', logError)
        }
      }
    })

    // Simpan job
    this.jobs.set(job.name, { job, task: scheduledTask })

    console.log(`📝 Registered job: ${job.name} (${job.schedule})${job.description ? ` - ${job.description}` : ''}`)

    // Jalankan saat startup jika diminta (hanya di development)
    if (runOnStartup && process.env.NODE_ENV === 'development') {
      console.log(`🚀 Job "${job.name}" will run on startup (delay: ${startupDelay}ms)`)
      setTimeout(async () => {
        const startTime = Date.now()
        let logId: string | null = null

        console.log(`▶️  Running startup job: ${job.name}`)

        try {
          // Create log entry - started
          const { PrismaClient } = await import('@prisma/client')
          const prisma = new PrismaClient()

          const log = await prisma.schedulerLog.create({
            data: {
              jobName: `${job.name} (startup)`,
              status: 'started',
              startedAt: new Date()
            }
          })

          logId = log.id

          // Execute job
          await job.task()

          const duration = Date.now() - startTime

          // Update log - success
          await prisma.schedulerLog.update({
            where: { id: logId },
            data: {
              status: 'success',
              completedAt: new Date(),
              duration
            }
          })

          await prisma.$disconnect()

          console.log(`✅ Startup job "${job.name}" completed (${duration}ms)`)
        } catch (error) {
          const duration = Date.now() - startTime

          console.error(`❌ Startup job "${job.name}" failed:`, error)

          // Update log - failed
          try {
            const { PrismaClient } = await import('@prisma/client')
            const prisma = new PrismaClient()

            if (logId) {
              await prisma.schedulerLog.update({
                where: { id: logId },
                data: {
                  status: 'failed',
                  completedAt: new Date(),
                  duration,
                  errorMessage: error instanceof Error ? error.message : String(error),
                  errorStack: error instanceof Error ? error.stack : undefined
                }
              })
            }

            await prisma.$disconnect()
          } catch (logError) {
            console.error('Failed to log startup error:', logError)
          }
        }
      }, startupDelay)
    }
  }

  /**
   * Menghapus job dari scheduler
   */
  removeJob(name: string): boolean {
    const jobEntry = this.jobs.get(name)

    if (!jobEntry) {
      console.warn(`⚠️  Job "${name}" not found`)

      return false
    }

    // Stop task
    jobEntry.task.stop()

    this.jobs.delete(name)
    console.log(`🗑️  Removed job: ${name}`)

    return true
  }

  /**
   * Mendapatkan semua job yang terdaftar
   */
  getJobs(): Map<string, { job: ScheduledJob; task: ScheduledTask }> {
    return this.jobs
  }

  /**
   * Menjalankan semua job yang terdaftar
   */
  start(): void {
    if (this.isStarted) {
      console.warn('⚠️  Scheduler already started')

      return
    }

    console.log(`\n🎯 Starting scheduler with ${this.jobs.size} job(s)...\n`)

    this.jobs.forEach(({ job, task }) => {
      task.start()
      console.log(`▶️  Started: ${job.name} - Schedule: ${job.schedule}`)
    })

    this.isStarted = true
    console.log('\n✅ Scheduler started successfully\n')
  }

  /**
   * Menghentikan semua job
   */
  stop(): void {
    if (!this.isStarted) {
      console.warn('⚠️  Scheduler is not running')

      return
    }

    console.log('⏹️  Stopping all scheduled jobs...')

    this.jobs.forEach(({ job, task }) => {
      task.stop()
      console.log(`⏸️  Stopped: ${job.name}`)
    })

    this.isStarted = false
    console.log('✅ Scheduler stopped')
  }

  /**
   * Mendapatkan status scheduler
   */
  getStatus(): { isRunning: boolean; jobCount: number; jobs: string[] } {
    return {
      isRunning: this.isStarted,
      jobCount: this.jobs.size,
      jobs: Array.from(this.jobs.keys())
    }
  }
}

// Export singleton instance
export const scheduler = new Scheduler()
