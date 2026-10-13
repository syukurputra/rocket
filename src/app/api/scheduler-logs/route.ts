import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

function isSuperAdmin(user: AuthContext['user']) {
  return user.roleId === 'superadmin' || user.role?.nama?.toLowerCase().replace(/\s+/g, '') === 'superadmin'
}

/**
 * API untuk melihat log scheduler
 * GET /api/scheduler-logs?limit=50&jobName=wilayah-sync&status=success
 */
async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    if (!isSuperAdmin(user)) {
      return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 })
    }

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
async function handleDelete(request: NextRequest, { user }: AuthContext) {
  try {
    if (!isSuperAdmin(user)) {
      return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    // Minimal 1 hari supaya nilai negatif/0 tidak menghapus semua log
    const olderThanDays = Math.max(1, parseInt(searchParams.get('olderThan') || '30') || 30)

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
      message: `${result.count} log lebih dari ${olderThanDays} hari berhasil dihapus`
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

export const GET = withAuth(handleGet)
export const DELETE = withAuth(handleDelete)
