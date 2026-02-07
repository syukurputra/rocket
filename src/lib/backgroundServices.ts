// Background services initialization
// This file is designed to be imported once to start all background services

let isInitialized = false

export function initializeBackgroundServices() {
  // Prevent multiple initializations
  if (isInitialized) {
    console.log('⚠️  Background services already initialized')

    return
  }

  // Only run on server side
  if (typeof window !== 'undefined') {
    return
  }

  console.log('🚀 Initializing background services...\n')

  // Dynamic import to avoid build-time execution
  import('./schedulerManager').then(({ scheduler }) => {
    import('../jobs').then(({ allJobs }) => {
      // Register all jobs
      console.log('📋 Registering scheduled jobs...\n')
      allJobs.forEach(job => {
        scheduler.registerJob(job)
      })

      // Start scheduler
      scheduler.start()

      isInitialized = true
    })
  })
}

// Auto-initialize when imported
initializeBackgroundServices()
