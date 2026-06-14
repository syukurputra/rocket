import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    const startDate = url.searchParams.get('startDate') || ''
    const endDate = url.searchParams.get('endDate') || ''
    const jenis = url.searchParams.get('jenis') || ''
    const asetId = url.searchParams.get('asetId') || ''
    const categoryKeuanganId = url.searchParams.get('categoryKeuanganId') || ''

    const whereClause: any = {}

    if (search) {
      whereClause.OR = [
        { keterangan: { contains: search.trim(), mode: 'insensitive' } },
        {
          aset: {
            nama: { contains: search.trim(), mode: 'insensitive' }
          }
        },
        {
          categoryKeuangan: {
            nama: { contains: search.trim(), mode: 'insensitive' }
          }
        }
      ]
    }

    if (startDate || endDate) {
      whereClause.tanggal = {}

      if (startDate) {
        whereClause.tanggal.gte = new Date(startDate)
      }

      if (endDate) {
        const end = new Date(endDate)

        end.setHours(23, 59, 59, 999)
        whereClause.tanggal.lte = end
      }
    } else {
      // Default to this month if no dates provided
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      
      whereClause.tanggal = {
        gte: startOfMonth,
        lte: endOfMonth
      }
    }

    if (jenis) {
      whereClause.jenis = jenis
    }

    if (asetId) {
      whereClause.asetId = asetId
    }

    if (categoryKeuanganId) {
      whereClause.categoryKeuanganId = categoryKeuanganId
    }

    whereClause.createdById = user.id

    // Query untuk mendapatkan semua transaksi sesuai filter
    const transaksisBulanIni = await prisma.keuangan.findMany({
      where: whereClause,
      select: {
        jenis: true,
        nominal: true
      }
    })

    // Menghitung total transaksi
    const totalTransaksi = transaksisBulanIni.length

    // Menghitung total pemasukan
    const totalPemasukan = transaksisBulanIni
      .filter(t => t.jenis.toLowerCase() === 'pemasukan')
      .reduce((sum, t) => sum + Number(t.nominal), 0)

    // Menghitung total pengeluaran
    const totalPengeluaran = transaksisBulanIni
      .filter(t => t.jenis.toLowerCase() === 'pengeluaran')
      .reduce((sum, t) => sum + Number(t.nominal), 0)

    // Menghitung saldo
    const saldo = totalPemasukan - totalPengeluaran

    return NextResponse.json({
      data: {
        totalTransaksi,
        totalPemasukan,
        totalPengeluaran,
        saldo
      },
      message: 'Ringkasan berhasil diambil'
    })
  } catch (error) {
    console.error('Get keuangan summary error:', error)

    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
