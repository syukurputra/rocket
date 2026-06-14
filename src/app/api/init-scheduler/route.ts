import { NextResponse } from 'next/server'

import { initializeBackgroundServices } from '@/src/lib/backgroundServices'

/**
 * API Route untuk initialize background services
 * Dipanggil otomatis saat aplikasi start
 */
export async function GET() {
  try {
    initializeBackgroundServices()

    return NextResponse.json({
      success: true,
      message: 'Layanan latar belakang berhasil diinisialisasi'
    })
  } catch (error) {
    console.error('Failed to initialize background services:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initialize background services'
      },
      { status: 500 }
    )
  }
}
