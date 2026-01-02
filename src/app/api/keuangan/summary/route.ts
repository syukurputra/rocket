import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'

async function handleGet(request: NextRequest, { user }: AuthContext) {
  try {
    // Mendapatkan tanggal awal dan akhir bulan ini
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    // Query untuk mendapatkan semua transaksi bulan ini
    const transaksisBulanIni = await prisma.keuangan.findMany({
      where: {
        createdById: user.id,
        tanggal: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
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
      message: 'Summary retrieved successfully'
    })
  } catch (error) {
    console.error('Get keuangan summary error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withAuth(handleGet)
