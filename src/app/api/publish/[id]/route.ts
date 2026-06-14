import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const data = await prisma.aset.findUnique({
      where: {
        id: id
      },
      include: {
        images: true,
        ruangan: {
          include: {
            images: true
          }
        }
      }
    })

    if (!data) {
      return NextResponse.json({ message: 'Data tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
