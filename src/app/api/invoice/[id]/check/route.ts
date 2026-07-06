import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { checkIpaymuTransaction } from '@/src/libs/ipaymu'

const DEMO_COMPANY_ID = 'company-demo-001'

async function handlePost(request: NextRequest, { params, user }: AuthContext & { params: { id: string } }) {
  try {
    if (!user.companyId) {
      return NextResponse.json({ message: 'Tidak terhubung dengan perusahaan' }, { status: 400 })
    }

    const { id } = params
    
    // Find the invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id }
    })

    if (!invoice) {
      return NextResponse.json({ message: 'Invoice tidak ditemukan' }, { status: 404 })
    }

    // Ensure it belongs to the user's company (demo company can access all)
    if (user.companyId !== DEMO_COMPANY_ID && invoice.companyId !== user.companyId) {
      return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 })
    }

    if (!invoice.ipaymuSessionId) {
      return NextResponse.json({ message: 'Invoice tidak tertaut dengan transaksi iPaymu' }, { status: 400 })
    }

    if (invoice.status === 'PAID') {
      return NextResponse.json({ 
        message: 'Invoice sudah lunas',
        data: invoice
      })
    }

    // Call iPaymu to check transaction status
    const ipaymuData = await checkIpaymuTransaction(invoice.ipaymuSessionId)

    // Log for debugging
    console.log('[iPaymu Check] Result:', ipaymuData)

    const statusMap: Record<number, string> = {
      1: 'berhasil',
      6: 'berhasil',
      0: 'pending',
      [-2]: 'expired'
    }

    const ipaymuStatusCode = ipaymuData.Data.Status
    const ipaymuStatusStr = statusMap[ipaymuStatusCode] || 'pending'

    let newStatus = invoice.status
    let tanggalBayar = invoice.tanggalBayar

    if (ipaymuStatusCode === 1 || ipaymuStatusCode === 6) {
      newStatus = 'PAID'
      tanggalBayar = new Date()
    } else if (ipaymuStatusCode === -2) {
      newStatus = 'EXPIRED'
    }

    if (newStatus !== invoice.status) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: newStatus,
          tanggalBayar,
          catatan: invoice.catatan 
            ? `${invoice.catatan}\n\n[System] iPaymu Check - Status: ${ipaymuStatusStr}`
            : `[System] iPaymu Check - Status: ${ipaymuStatusStr}`
        }
      })
      
      invoice.status = newStatus
      invoice.tanggalBayar = tanggalBayar
    }

    return NextResponse.json({ 
      message: `Status transaksi: ${ipaymuStatusStr.toUpperCase()}`,
      data: invoice 
    })

  } catch (error) {
    console.error('Check invoice error:', error)
    return NextResponse.json({ 
      message: error instanceof Error ? error.message : 'Internal Server Error' 
    }, { status: 500 })
  }
}

export const POST = withAuth(handlePost)

