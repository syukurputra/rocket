import { NextResponse } from 'next/server'

import prisma from '@/src/libs/prisma'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

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
      return NextResponse.json({ message: 'Data not found' }, { status: 404 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
