'use client'

import { useEffect } from 'react'

/**
 * Component untuk initialize scheduler saat aplikasi load
 * Harus client component agar bisa panggil API
 */
export default function SchedulerInit() {
  useEffect(() => {
    // Initialize scheduler via API call
    fetch('/api/init-scheduler')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log('✅ Scheduler initialized successfully')
        }
      })
      .catch(err => {
        console.error('❌ Failed to initialize scheduler:', err)
      })
  }, [])

  return null // This component doesn't render anything
}
