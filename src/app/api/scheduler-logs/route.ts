import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * API untuk melihat log scheduler
 * GET /api/scheduler-logs?limit=50&jobName=wilayah-sync&status=success
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const jobName = searchParams.get('jobName')
    const status = searchParams.get('status')

    const where: any = {}

    if (jobName) {
      where.jobName = { contains: jobName }
    }

    if (status) {
      where.status = status
    }

    const logs = await prisma.schedulerLog.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: limit
    })

    // Calculate statistics
    const stats = await prisma.schedulerLog.groupBy({
      by: ['status'],
      _count: true
    })

    const totalLogs = await prisma.schedulerLog.count({ where })

    return NextResponse.json({
      success: true,
      data: {
        logs,
        stats: stats.reduce(
          (acc, item) => {
            acc[item.status] = item._count

            return acc
          },
          {} as Record<string, number>
        ),
        total: totalLogs
      }
    })
  } catch (error) {
    console.error('Failed to fetch scheduler logs:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch scheduler logs'
      },
      { status: 500 }
    )
  }
}

/**
 * API untuk menghapus log lama
 * DELETE /api/scheduler-logs?olderThan=30
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const olderThanDays = parseInt(searchParams.get('olderThan') || '30')

    const cutoffDate = new Date()

    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    const result = await prisma.schedulerLog.deleteMany({
      where: {
        startedAt: {
          lt: cutoffDate
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} logs older than ${olderThanDays} days`
    })
  } catch (error) {
    console.error('Failed to delete old logs:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete old logs'
      },
      { status: 500 }
    )
  }
}
