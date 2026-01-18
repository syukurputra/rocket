import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/libs/prisma'
import { withAuth, type AuthContext } from '@/src/libs/auth-middleware'
import { sendTagihanNotificationEmail } from '@/src/mails/tagihanNotificationEmail'

type ParamCtx = AuthContext & { params: { id: string } }

async function handlePost(request: NextRequest, { params }: ParamCtx) {
  try {
    const { id } = await params

    const tagihan = await prisma.tagihan.findUnique({
      where: { id },
      include: {
        penghuni: {
          select: {
            id: true,
            nama: true,
            email: true
          }
        }
      }
    })

    if (!tagihan) {
      return NextResponse.json({ message: 'Tagihan tidak ditemukan' }, { status: 404 })
    }

    if (!tagihan.penghuni?.email) {
      return NextResponse.json({ message: 'Penghuni tidak memiliki email' }, { status: 400 })
    }

    // Send email notification
    try {
      await sendTagihanNotificationEmail(
        tagihan.penghuni.email,
        tagihan.penghuni.nama,
        tagihan.keterangan,
        tagihan.mulaiSewa.toISOString(),
        tagihan.selesaiSewa.toISOString(),
        Number(tagihan.nominal),
        tagihan.status
      )

      return NextResponse.json({
        message: 'Email berhasil dikirim'
      })
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError)
      return NextResponse.json({ message: 'Gagal mengirim email' }, { status: 500 })
    }
  } catch (error) {
    console.error('Send email error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withAuth<{ id: string }>(handlePost)
